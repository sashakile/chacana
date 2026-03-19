/**
 * Converts a tree-sitter CST into a Chacana ValidationToken AST.
 * Ports the logic from src/chacana/visitor.py to tree-sitter node walking.
 */

import type { SyntaxNode } from "./parser.js";
import {
  type ChacanaIndex,
  type ValidationToken,
  type SourceRange,
  Variance,
  detectIndexType,
  makeToken,
  HEAD_ADD,
  HEAD_NEGATE,
  HEAD_MULTIPLY,
  HEAD_WEDGE,
  HEAD_NUMBER,
  HEAD_PERTURBATION,
  HEAD_COMMUTATOR,
  FUNCTIONAL_OP_MAP,
} from "./ast.js";

function rangeOf(node: SyntaxNode): SourceRange {
  return {
    startLine: node.startPosition.row,
    startColumn: node.startPosition.column,
    endLine: node.endPosition.row,
    endColumn: node.endPosition.column,
  };
}

function buildIndex(
  varianceStr: string | null,
  name: string,
  isDerivative: boolean = false,
  derivativeType: "semicolon" | "comma" | null = null,
): ChacanaIndex {
  return {
    label: name,
    variance: varianceStr === "^" ? Variance.Contra : Variance.Covar,
    indexType: detectIndexType(name),
    isDerivative,
    derivativeType,
  };
}

/**
 * Build a ValidationToken from a tree-sitter CST root node.
 * Returns null if the node cannot be converted (e.g., ERROR nodes).
 */
export function buildAST(node: SyntaxNode): ValidationToken | null {
  if (node.type === "source_file") {
    // source_file wraps a single _expression
    const child = node.namedChildren[0];
    return child ? buildAST(child) : null;
  }

  if (node.hasError) return null;

  switch (node.type) {
    case "sum_expression":
      return buildBinaryFlat(node, HEAD_ADD, "+", "-");
    case "product_expression":
      return buildBinaryFlat(node, HEAD_MULTIPLY, "*");
    case "wedge_expression":
      return buildBinaryFlat(node, HEAD_WEDGE, "^");
    case "tensor_expr":
      return buildTensor(node);
    case "functional_op":
      return buildFunctionalOp(node);
    case "scalar":
      return buildScalar(node);
    case "perturbation":
      return buildPerturbation(node);
    case "commutator":
      return buildCommutator(node);
    case "paren_expression":
      return buildAST(node.namedChildren[0]);
    default:
      return null;
  }
}

/**
 * Flatten left-associative binary expressions into a flat args list.
 * tree-sitter: sum_expression(sum_expression(A, +, B), +, C)
 * AST:         Add(A, B, C)
 */
function buildBinaryFlat(
  node: SyntaxNode,
  head: string,
  ...operators: string[]
): ValidationToken | null {
  const terms: ValidationToken[] = [];
  const ops: string[] = [];

  collectBinaryTerms(node, head, terms, ops);

  // Wrap subtracted terms in Negate (for sum with -)
  const args: ValidationToken[] = [];
  for (let i = 0; i < terms.length; i++) {
    if (i > 0 && ops[i - 1] === "-") {
      args.push(makeToken(HEAD_NEGATE, [terms[i]], [], null, {}, rangeOf(node)));
    } else {
      args.push(terms[i]);
    }
  }

  if (args.length === 1) return args[0];
  return makeToken(head, args, [], null, {}, rangeOf(node));
}

function collectBinaryTerms(
  node: SyntaxNode,
  head: string,
  terms: ValidationToken[],
  ops: string[],
): void {
  if (node.type !== nodeTypeForHead(head)) {
    const t = buildAST(node);
    if (t) terms.push(t);
    return;
  }

  const left = node.childForFieldName("left");
  const right = node.childForFieldName("right");
  const opNode = node.childForFieldName("operator");

  if (left) collectBinaryTerms(left, head, terms, ops);
  if (opNode) ops.push(opNode.type);
  if (right) {
    const t = buildAST(right);
    if (t) terms.push(t);
  }
}

function nodeTypeForHead(head: string): string {
  if (head === HEAD_ADD) return "sum_expression";
  if (head === HEAD_MULTIPLY) return "product_expression";
  if (head === HEAD_WEDGE) return "wedge_expression";
  return "";
}

function buildTensor(node: SyntaxNode): ValidationToken {
  const nameNode = node.childForFieldName("name");
  const name = nameNode?.text ?? "";
  const indexBlock = node.childForFieldName("indices");
  const { indices, metadata } = indexBlock
    ? buildIndexList(indexBlock.namedChildren[0])
    : { indices: [] as ChacanaIndex[], metadata: {} };
  return makeToken(name, [], indices, null, metadata, rangeOf(node));
}

function buildFunctionalOp(node: SyntaxNode): ValidationToken {
  const nameNode = node.childForFieldName("name");
  const name = nameNode?.text ?? "";
  const head = FUNCTIONAL_OP_MAP[name] ?? name;

  const argsNode = node.childForFieldName("arguments");
  const args: ValidationToken[] = [];
  if (argsNode) {
    for (const child of argsNode.namedChildren) {
      const t = buildAST(child);
      if (t) args.push(t);
    }
  }

  const indexBlock = node.childForFieldName("indices");
  const { indices, metadata } = indexBlock
    ? buildIndexList(indexBlock.namedChildren[0])
    : { indices: [] as ChacanaIndex[], metadata: {} };

  return makeToken(head, args, indices, null, metadata, rangeOf(node));
}

function buildScalar(node: SyntaxNode): ValidationToken {
  const text = node.text;
  const val = text.includes(".") ? parseFloat(text) : parseInt(text, 10);
  return makeToken(HEAD_NUMBER, [], [], val, {}, rangeOf(node));
}

function buildPerturbation(node: SyntaxNode): ValidationToken {
  const orderNode = node.childForFieldName("order");
  const bodyNode = node.childForFieldName("body");
  const order = orderNode ? parseInt(orderNode.text, 10) : 0;
  const body = bodyNode ? buildAST(bodyNode) : null;
  return makeToken(
    HEAD_PERTURBATION,
    body ? [body] : [],
    [],
    null,
    { order },
    rangeOf(node),
  );
}

function buildCommutator(node: SyntaxNode): ValidationToken {
  const left = node.childForFieldName("left");
  const right = node.childForFieldName("right");
  const args: ValidationToken[] = [];
  if (left) { const t = buildAST(left); if (t) args.push(t); }
  if (right) { const t = buildAST(right); if (t) args.push(t); }
  return makeToken(HEAD_COMMUTATOR, args, [], null, {}, rangeOf(node));
}

interface IndexListResult {
  indices: ChacanaIndex[];
  metadata: Record<string, unknown>;
}

function buildIndexList(indexListNode: SyntaxNode): IndexListResult {
  if (!indexListNode || indexListNode.type !== "index_list") {
    return { indices: [], metadata: {} };
  }

  const flatIndices: ChacanaIndex[] = [];
  const symGroups: number[][] = [];
  const antisymGroups: number[][] = [];

  for (const child of indexListNode.namedChildren) {
    if (child.type === "index") {
      flatIndices.push(buildSingleIndex(child));
    } else if (child.type === "symmetrization" || child.type === "anti_symmetrization") {
      const innerList = child.namedChildren.find((c) => c.type === "index_list");
      if (innerList) {
        const start = flatIndices.length;
        const innerResult = buildIndexList(innerList);
        const positions: number[] = [];
        for (let i = 0; i < innerResult.indices.length; i++) {
          positions.push(start + i);
        }
        flatIndices.push(...innerResult.indices);
        if (child.type === "symmetrization") {
          symGroups.push(positions);
        } else {
          antisymGroups.push(positions);
        }
      }
    }
  }

  const metadata: Record<string, unknown> = {};
  if (symGroups.length > 0) metadata.symmetrized_groups = symGroups;
  if (antisymGroups.length > 0) metadata.antisymmetrized_groups = antisymGroups;

  return { indices: flatIndices, metadata };
}

function buildSingleIndex(node: SyntaxNode): ChacanaIndex {
  const varianceNode = node.childForFieldName("variance");
  const nameNode = node.childForFieldName("name");

  if (!nameNode) {
    return buildIndex(varianceNode?.text ?? null, "");
  }

  if (nameNode.type === "derivative") {
    const typeNode = nameNode.childForFieldName("type");
    const derivNameNode = nameNode.childForFieldName("name");
    const dtype = typeNode?.text === ";" ? "semicolon" : "comma";
    return buildIndex(
      varianceNode?.text ?? null,
      derivNameNode?.text ?? "",
      true,
      dtype as "semicolon" | "comma",
    );
  }

  return buildIndex(varianceNode?.text ?? null, nameNode.text);
}
