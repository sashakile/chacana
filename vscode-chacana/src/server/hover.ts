/**
 * Hover provider: shows tensor info and operator documentation.
 */

import type { SyntaxNode } from "./parser.js";
import type { GlobalContext } from "./context.js";

function sameNode(a: SyntaxNode, b: SyntaxNode): boolean {
  return a.id === b.id;
}

const OPERATOR_DOCS: Record<string, string> = {
  d: "**Exterior derivative** `d(omega)` — maps a p-form to a (p+1)-form",
  L: "**Lie derivative** `L(X, T)` — derivative of tensor T along vector field X",
  Tr: "**Trace** `Tr(T)` — contracts a rank-2+ tensor over one pair of indices",
  det: "**Determinant** `det(M)` — determinant of a rank-2 tensor",
  inv: "**Inverse** `inv(M)` — matrix inverse of a rank-2 tensor",
  star: "**Hodge star** `star(omega)` — requires active metric",
  hodge: "**Hodge star** `hodge(omega)` — requires active metric",
  i: "**Interior product** `i(X, omega)` — contraction of vector X with form omega",
};

/**
 * Find the named node at the given position in the CST.
 */
function nodeAtPosition(
  root: SyntaxNode,
  line: number,
  column: number,
): SyntaxNode | null {
  let node: SyntaxNode | null = root.descendantForPosition({ row: line, column });
  // Walk up to find a named node
  while (node && !node.isNamed) {
    node = node.parent;
  }
  return node;
}

/**
 * Get hover content for a position in the CST.
 * Returns Markdown string or null.
 */
export function getHover(
  root: SyntaxNode,
  line: number,
  column: number,
  ctx: GlobalContext | null,
): string | null {
  const node = nodeAtPosition(root, line, column);
  if (!node) return null;

  const name = node.text;
  const parent = node.parent;

  // Functional operator hover (operator_keyword node inside functional_op)
  if (node.type === "operator_keyword" && parent?.type === "functional_op") {
    if (OPERATOR_DOCS[name]) return OPERATOR_DOCS[name];
  }

  if (node.type !== "identifier") return null;

  // Tensor hover (from context)
  if (ctx && parent?.type === "tensor_expr") {
    const fieldName = parent.childForFieldName("name");
    if (fieldName && sameNode(fieldName, node)) {
      const decl = ctx.tensors.get(name);
      if (decl) {
        const parts = [`**${name}** — Tensor on manifold ${decl.manifold}`];
        parts.push(`- Rank: ${decl.rank}`);
        if (decl.indexPattern.length > 0) {
          parts.push(`- Index pattern: [${decl.indexPattern.join(", ")}]`);
        }
        for (const sym of decl.symmetries) {
          parts.push(`- ${sym.type} in slots [${sym.indices.join(", ")}]`);
        }
        return parts.join("\n");
      }
    }
  }

  return null;
}
