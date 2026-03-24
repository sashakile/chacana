/**
 * Go-to-definition: jump from tensor name in .chcn to its [tensor.X]
 * declaration in the TOML context file.
 */

import type { SyntaxNode } from "./parser.js";

function sameNode(a: SyntaxNode, b: SyntaxNode): boolean {
  return a.id === b.id;
}

interface DefinitionLocation {
  uri: string;
  line: number;
}

/**
 * Get the definition location for a tensor name at the given position.
 * Returns null if the position is not on a tensor name or no TOML mapping exists.
 */
export function getDefinition(
  root: SyntaxNode,
  line: number,
  column: number,
  tomlPath: string | null,
  tensorLines: Map<string, number> | null,
): DefinitionLocation | null {
  if (!tomlPath || !tensorLines) return null;

  let node: SyntaxNode | null = root.descendantForPosition({ row: line, column });
  while (node && !node.isNamed) node = node.parent;
  if (!node || node.type !== "identifier") return null;

  const parent = node.parent;
  if (parent?.type !== "tensor_expr") return null;

  const fieldName = parent.childForFieldName("name");
  if (!fieldName || !sameNode(fieldName, node)) return null;

  const name = node.text;
  const tomlLine = tensorLines.get(name);
  if (tomlLine == null) return null;

  return { uri: tomlPath, line: tomlLine };
}
