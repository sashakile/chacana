/**
 * Chacana LSP server.
 *
 * Provides real-time diagnostics for .chcn files using web-tree-sitter
 * for incremental parsing and the Chacana type checker for semantic analysis.
 */

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  TextDocumentSyncKind,
  type InitializeResult,
  type Diagnostic,
  DiagnosticSeverity,
} from "vscode-languageserver/node.js";
import { TextDocument } from "vscode-languageserver-textdocument";
import { initParser, createParser, parse } from "./parser.js";
import { extractSyntaxErrors } from "./syntaxErrors.js";

import type TreeSitterType from "web-tree-sitter";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

let parser: TreeSitterType | null = null;

connection.onInitialize(async (): Promise<InitializeResult> => {
  try {
    await initParser();
    parser = createParser();
    connection.console.log("Chacana LSP: tree-sitter initialized");
  } catch (err) {
    connection.console.error(`Chacana LSP: failed to init parser: ${err}`);
  }

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      // Phase 3: hoverProvider, definitionProvider
    },
  };
});

documents.onDidChangeContent((change) => {
  validateDocument(change.document);
});

documents.onDidClose((event) => {
  connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
});

function validateDocument(doc: TextDocument): void {
  if (!parser) return;

  const source = doc.getText();
  const diagnostics: Diagnostic[] = [];

  // Parse each non-empty, non-comment line as a separate expression
  const lines = source.split("\n");
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const raw = lines[lineIdx];
    const stripped = raw.trim();
    if (!stripped || stripped.startsWith("#")) continue;

    // Parse raw line to preserve column positions
    const tree = parse(parser, raw);
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

    // TODO Phase 2: if no syntax errors, build AST and run checker
  }

  connection.sendDiagnostics({ uri: doc.uri, diagnostics });
}

documents.listen(connection);
connection.listen();
