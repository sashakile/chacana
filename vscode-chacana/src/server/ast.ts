/**
 * Core AST types for Chacana tensor expressions.
 * Ports src/chacana/ast.py to TypeScript.
 */

export enum Variance {
  Contra = "Contra",
  Covar = "Covar",
}

export enum IndexType {
  Latin = "Latin",
  Greek = "Greek",
  Spinor = "Spinor",
}

export interface ChacanaIndex {
  label: string;
  variance: Variance;
  indexType: IndexType;
  isDerivative: boolean;
  derivativeType: "semicolon" | "comma" | null;
}

export interface SourceRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface TokenMetadata {
  symmetrized_groups: number[][];
  antisymmetrized_groups: number[][];
  order: number | null;
}

export function emptyMetadata(): TokenMetadata {
  return { symmetrized_groups: [], antisymmetrized_groups: [], order: null };
}

export interface ValidationToken {
  head: string;
  indices: ChacanaIndex[];
  args: ValidationToken[];
  value: number | null;
  metadata: TokenMetadata;
  range: SourceRange | null;
}

// Canonical head names (same as ast.py)
export const HEAD_ADD = "Add";
export const HEAD_NEGATE = "Negate";
export const HEAD_MULTIPLY = "Multiply";
export const HEAD_WEDGE = "Wedge";
export const HEAD_EXTERIOR_DERIVATIVE = "ExteriorDerivative";
export const HEAD_LIE_DERIVATIVE = "LieDerivative";
export const HEAD_TRACE = "Trace";
export const HEAD_DETERMINANT = "Determinant";
export const HEAD_INVERSE = "Inverse";
export const HEAD_HODGE_STAR = "HodgeStar";
export const HEAD_INTERIOR_PRODUCT = "InteriorProduct";
export const HEAD_PERTURBATION = "Perturbation";
export const HEAD_COMMUTATOR = "Commutator";
export const HEAD_NUMBER = "Number";

/** Map from functional operator identifier to canonical head. */
export const FUNCTIONAL_OP_MAP: Record<string, string> = {
  d: HEAD_EXTERIOR_DERIVATIVE,
  L: HEAD_LIE_DERIVATIVE,
  Tr: HEAD_TRACE,
  det: HEAD_DETERMINANT,
  inv: HEAD_INVERSE,
  star: HEAD_HODGE_STAR,
  hodge: HEAD_HODGE_STAR,
  i: HEAD_INTERIOR_PRODUCT,
};

/** Structural heads that are operators, not tensor names. */
export const STRUCTURAL_HEADS = new Set([
  HEAD_ADD,
  HEAD_NEGATE,
  HEAD_MULTIPLY,
  HEAD_WEDGE,
  HEAD_EXTERIOR_DERIVATIVE,
  HEAD_LIE_DERIVATIVE,
  HEAD_TRACE,
  HEAD_DETERMINANT,
  HEAD_INVERSE,
  HEAD_HODGE_STAR,
  HEAD_INTERIOR_PRODUCT,
  HEAD_PERTURBATION,
  HEAD_COMMUTATOR,
  HEAD_NUMBER,
]);

/** Greek lowercase range for index type detection. */
const GREEK_RE = /[\u03B1-\u03C9\u0391-\u03A9]/;

export function detectIndexType(label: string): IndexType {
  return GREEK_RE.test(label) ? IndexType.Greek : IndexType.Latin;
}

/** Pre-order traversal of a token tree. */
export function* walkTokens(token: ValidationToken): Generator<ValidationToken> {
  yield token;
  for (const arg of token.args) {
    yield* walkTokens(arg);
  }
}

export function makeToken(
  head: string,
  args: ValidationToken[] = [],
  indices: ChacanaIndex[] = [],
  value: number | null = null,
  metadata: TokenMetadata = emptyMetadata(),
  range: SourceRange | null = null,
): ValidationToken {
  return { head, args, indices, value, metadata, range };
}
