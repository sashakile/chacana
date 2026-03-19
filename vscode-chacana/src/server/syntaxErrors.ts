/**
 * Extract syntax diagnostics from tree-sitter ERROR and MISSING nodes.
 */

import type { SyntaxNode } from "./parser.js";

export interface SyntaxDiagnostic {
  message: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

/**
 * Walk the CST and collect all ERROR / MISSING nodes as diagnostics.
 */
export function extractSyntaxErrors(root: SyntaxNode): SyntaxDiagnostic[] {
  const diagnostics: SyntaxDiagnostic[] = [];
  walkForErrors(root, diagnostics);
  return diagnostics;
}

function walkForErrors(
  node: SyntaxNode,
  diagnostics: SyntaxDiagnostic[],
): void {
  if (node.isMissing) {
    diagnostics.push({
      message: `Expected ${node.type}`,
      startLine: node.startPosition.row,
      startColumn: node.startPosition.column,
      endLine: node.endPosition.row,
      endColumn: node.endPosition.column,
    });
    return; // MISSING nodes have no children
  }

  if (node.type === "ERROR") {
    diagnostics.push({
      message: "Syntax error",
      startLine: node.startPosition.row,
      startColumn: node.startPosition.column,
      endLine: node.endPosition.row,
      endColumn: node.endPosition.column,
    });
    // Don't recurse into ERROR children to avoid duplicate diagnostics
    return;
  }

  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child) walkForErrors(child, diagnostics);
  }
}
