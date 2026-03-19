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
const trees = new Map<string, Tree>();

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
  trees.delete(event.document.uri);
  connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});

function validateDocument(doc: TextDocument): void {
  if (!parser) return;

  const source = doc.getText();
  const diagnostics: Diagnostic[] = [];
  const resolved = resolveContext(doc.uri, source);

  const lines = source.split("\n");
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const raw = lines[lineIdx];
    const stripped = raw.trim();
    if (!stripped || stripped.startsWith("#")) continue;

    const tree = parse(parser, raw);
    trees.set(`${doc.uri}:${lineIdx}`, tree);

    // Layer 1: syntax errors from tree-sitter
    const syntaxErrors = extractSyntaxErrors(tree.rootNode);
    for (const err of syntaxErrors) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: lineIdx, character: err.startColumn },
          end: { line: lineIdx, character: err.endColumn },
        },
        message: err.message,
        source: "chacana",
      });
    }

    // Layer 2: type checker (only when syntax is clean)
    if (syntaxErrors.length === 0) {
      const ast = buildAST(tree.rootNode);
      if (ast) {
        const checkerDiags = checkAll(ast, resolved?.ctx ?? null);
        for (const d of checkerDiags) {
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
              start: { line: lineIdx, character: d.range?.startColumn ?? 0 },
              end: { line: lineIdx, character: d.range?.endColumn ?? raw.length },
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

  const lines = doc.getText().split("\n");
  const lineIdx = params.position.line;
  const raw = lines[lineIdx];
  if (!raw || raw.trim().startsWith("#")) return null;

  const tree = parse(parser, raw);
  const resolved = resolveContext(doc.uri, doc.getText());
  const content = getHover(
    tree.rootNode,
    0, // parsed single line, so row is always 0
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

  const lines = doc.getText().split("\n");
  const lineIdx = params.position.line;
  const raw = lines[lineIdx];
  if (!raw || raw.trim().startsWith("#")) return null;

  const tree = parse(parser, raw);
  const resolved = resolveContext(doc.uri, doc.getText());
  const def = getDefinition(
    tree.rootNode,
    0,
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
