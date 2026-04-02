/**
 * Bidirectional LaTeX ↔ Chacana transpiler.
 */

import type { ValidationToken, ChacanaIndex } from "./ast.js";
import {
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
  HEAD_NUMBER,
  Variance,
  STRUCTURAL_HEADS,
} from "./ast.js";

/** Unicode → LaTeX command mapping for Greek letters. */
const GREEK_TO_LATEX: Record<string, string> = {
  α: "\\alpha", β: "\\beta", γ: "\\gamma", δ: "\\delta",
  ε: "\\epsilon", ζ: "\\zeta", η: "\\eta", θ: "\\theta",
  ι: "\\iota", κ: "\\kappa", λ: "\\lambda", μ: "\\mu",
  ν: "\\nu", ξ: "\\xi", π: "\\pi", ρ: "\\rho",
  σ: "\\sigma", τ: "\\tau", υ: "\\upsilon", φ: "\\phi",
  χ: "\\chi", ψ: "\\psi", ω: "\\omega",
  Γ: "\\Gamma", Δ: "\\Delta", Θ: "\\Theta", Λ: "\\Lambda",
  Ξ: "\\Xi", Π: "\\Pi", Σ: "\\Sigma", Υ: "\\Upsilon",
  Φ: "\\Phi", Ψ: "\\Psi", Ω: "\\Omega",
};

const GREEK_RE = /[\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9]/g;

function greekToLatex(s: string): string {
  return s.replace(GREEK_RE, (ch) => GREEK_TO_LATEX[ch] ?? ch);
}

function renderIndices(token: ValidationToken): string {
  const { indices, metadata } = token;
  if (indices.length === 0) return "";

  const symStarts = new Set<number>();
  const symEnds = new Set<number>();
  const antiStarts = new Set<number>();
  const antiEnds = new Set<number>();

  for (const group of metadata.symmetrized_groups) {
    if (group.length >= 2) {
      symStarts.add(group[0]);
      symEnds.add(group[group.length - 1]);
    }
  }
  for (const group of metadata.antisymmetrized_groups) {
    if (group.length >= 2) {
      antiStarts.add(group[0]);
      antiEnds.add(group[group.length - 1]);
    }
  }

  let result = "";
  let i = 0;
  while (i < indices.length) {
    const currentVariance = indices[i].variance;

    // Collect a run of same-variance indices
    let runEnd = i + 1;
    while (runEnd < indices.length && indices[runEnd].variance === currentVariance) {
      runEnd++;
    }

    const marker = currentVariance === Variance.Contra ? "^" : "_";

    // Emit empty-brace separator between variance changes (staggered form)
    if (i > 0) {
      result += "{}";
    }

    result += marker + "{";

    for (let j = i; j < runEnd; j++) {
      if (j > i) result += " ";

      if (symStarts.has(j)) result += "(";
      if (antiStarts.has(j)) result += "[";

      const idx = indices[j];
      if (idx.isDerivative && idx.derivativeType === "semicolon") {
        result += ";\\! ";
      }

      result += greekToLatex(idx.label);

      if (symEnds.has(j)) result += ")";
      if (antiEnds.has(j)) result += "]";
    }

    result += "}";
    i = runEnd;
  }

  return result;
}

export function toLatex(token: ValidationToken): string {
  const { head, args, indices, value } = token;

  // Number literal
  if (head === HEAD_NUMBER) {
    return value != null ? String(value) : "0";
  }

  // Negation: -<inner>
  if (head === HEAD_NEGATE && args.length === 1) {
    return "-" + toLatex(args[0]);
  }

  // Addition: a + b + ...
  if (head === HEAD_ADD) {
    return args.map(toLatex).join(" + ");
  }

  // Multiplication: implicit juxtaposition
  if (head === HEAD_MULTIPLY) {
    return args.map(toLatex).join(" ");
  }

  // Wedge product: a \wedge b
  if (head === HEAD_WEDGE) {
    return args.map(toLatex).join(" \\wedge ");
  }

  // Lie derivative: \mathcal{L}_{X} <body>
  if (head === HEAD_LIE_DERIVATIVE && args.length === 2) {
    return `\\mathcal{L}_{${toLatex(args[0])}} ${toLatex(args[1])}`;
  }

  // Interior product: \iota_{X} <body>
  if (head === HEAD_INTERIOR_PRODUCT && args.length === 2) {
    return `\\iota_{${toLatex(args[0])}} ${toLatex(args[1])}`;
  }

  // Inverse: g^{-1}
  if (head === HEAD_INVERSE && args.length === 1) {
    return toLatex(args[0]) + "^{-1}";
  }

  // Determinant: \det(<inner>)
  if (head === HEAD_DETERMINANT && args.length === 1) {
    return `\\det(${toLatex(args[0])})`;
  }

  // Trace: \operatorname{Tr}(<inner>)
  if (head === HEAD_TRACE && args.length === 1) {
    return `\\operatorname{Tr}(${toLatex(args[0])})`;
  }

  // Hodge star: \star(<inner>)
  if (head === HEAD_HODGE_STAR && args.length === 1) {
    return `\\star(${toLatex(args[0])})`;
  }

  // Exterior derivative: d(<inner>)
  if (head === HEAD_EXTERIOR_DERIVATIVE && args.length === 1) {
    return `d(${toLatex(args[0])})`;
  }

  // Tensor or plain identifier
  if (!STRUCTURAL_HEADS.has(head)) {
    const name = greekToLatex(head);
    return name + renderIndices(token);
  }

  // Fallback for unhandled structural heads
  const inner = args.map(toLatex).join(", ");
  return `\\operatorname{${head}}(${inner})`;
}
