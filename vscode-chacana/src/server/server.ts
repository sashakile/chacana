/**
 * Chacana LSP server.
 *
 * Provides real-time diagnostics, hover info, and go-to-definition
 * for .chcn files using web-tree-sitter + the Chacana type checker.
 */

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  TextDocumentSyncKind,
  type InitializeResult,
  type Diagnostic,
  type TextDocumentPositionParams,
  type Hover,
  type DefinitionParams,
  type Location,
  DiagnosticSeverity,
  MarkupKind,
} from "vscode-languageserver/node.js";
import { TextDocument } from "vscode-languageserver-textdocument";
import { URI } from "vscode-uri";
import type TreeSitterType from "web-tree-sitter";

import { initParser, createParser, parse, type Tree } from "./parser.js";
import { extractSyntaxErrors } from "./syntaxErrors.js";
import { buildAST } from "./astBuilder.js";
import { checkAll } from "./checker.js";
import { resolveContext, invalidateContextCache } from "./contextResolver.js";
import { getHover } from "./hover.js";
import { getDefinition } from "./definition.js";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

let parser: TreeSitterType | null = null;

/** Per-document storage: URI → full document tree. */
const docTrees = new Map<string, Tree>();

// ── Initialization ─────────────────────────────────────────────────

connection.onInitialize(async (): Promise<InitializeResult> => {
  try {
    await initParser();
    parser = createParser();
    connection.console.log("Chacana LSP: parser initialized");
  } catch (err) {
    connection.console.error(`Chacana LSP: failed to init parser: ${err}`);
  }

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      hoverProvider: true,
      definitionProvider: true,
    },
  };
});

// ── Diagnostics ────────────────────────────────────────────────────

documents.onDidChangeContent((change) => {
  validateDocument(change.document);
});

documents.onDidClose((event) => {
  const tree = docTrees.get(event.document.uri);
  if (tree) {
    tree.delete();
    docTrees.delete(event.document.uri);
  }
  connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});

function validateDocument(doc: TextDocument): void {
  if (!parser) return;

  const source = doc.getText();
  const diagnostics: Diagnostic[] = [];
  const resolved = resolveContext(doc.uri, source);

  // Parse the whole document at once (supports multi-line expressions).
  const oldTree = docTrees.get(doc.uri);
  const tree = parse(parser, source, oldTree);
  oldTree?.delete();
  docTrees.set(doc.uri, tree);

  // Layer 1: syntax errors from tree-sitter
  const syntaxErrors = extractSyntaxErrors(tree.rootNode);
  for (const err of syntaxErrors) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: { line: err.startLine, character: err.startColumn },
        end: { line: err.endLine, character: err.endColumn },
      },
      message: err.message,
      source: "chacana",
    });
  }

  // Layer 2: type checker per expression (only when syntax is clean)
  if (syntaxErrors.length === 0) {
    for (const child of tree.rootNode.namedChildren) {
      const ast = buildAST(child);
      if (ast) {
        const checkerDiags = checkAll(ast, resolved?.ctx ?? null);
        for (const d of checkerDiags) {
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
              start: {
                line: d.range?.startLine ?? child.startPosition.row,
                character: d.range?.startColumn ?? 0,
              },
              end: {
                line: d.range?.endLine ?? child.endPosition.row,
                character: d.range?.endColumn ?? child.endPosition.column,
              },
            },
            message: d.message,
            source: "chacana",
            code: d.code,
          });
        }
      }
    }
  }

  connection.sendDiagnostics({ uri: doc.uri, diagnostics });
}

// ── Hover ──────────────────────────────────────────────────────────

connection.onHover((params: TextDocumentPositionParams): Hover | null => {
  if (!parser) return null;
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return null;

  const tree = docTrees.get(doc.uri) ?? parse(parser, doc.getText());
  const resolved = resolveContext(doc.uri, doc.getText());
  const content = getHover(
    tree.rootNode,
    params.position.line,
    params.position.character,
    resolved?.ctx ?? null,
  );

  if (!content) return null;
  return {
    contents: { kind: MarkupKind.Markdown, value: content },
  };
});

// ── Go-to-Definition ───────────────────────────────────────────────

connection.onDefinition((params: DefinitionParams): Location | null => {
  if (!parser) return null;
  const doc = documents.get(params.textDocument.uri);
  if (!doc) return null;

  const tree = docTrees.get(doc.uri) ?? parse(parser, doc.getText());
  const resolved = resolveContext(doc.uri, doc.getText());
  const def = getDefinition(
    tree.rootNode,
    params.position.line,
    params.position.character,
    resolved?.tomlPath ?? null,
    resolved?.tensorLines ?? null,
  );

  if (!def) return null;
  return {
    uri: URI.file(def.uri).toString(),
    range: {
      start: { line: def.line, character: 0 },
      end: { line: def.line, character: 0 },
    },
  };
});

// ── File watching (invalidate TOML cache) ──────────────────────────

connection.onDidChangeWatchedFiles(() => {
  invalidateContextCache();
  // Re-validate all open documents
  for (const doc of documents.all()) {
    validateDocument(doc);
  }
});

// ── Start ──────────────────────────────────────────────────────────

documents.listen(connection);
connection.listen();
