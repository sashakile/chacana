/**
 * Bidirectional LaTeX ↔ Chacana transpiler.
 */

import type { ValidationToken } from "./ast.js";
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
      } else if (idx.isDerivative && idx.derivativeType === "comma") {
        result += ",\\! ";
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

/** Heads that produce compound (multi-term) LaTeX needing parens when negated. */
const COMPOUND_HEADS = new Set([HEAD_ADD, HEAD_WEDGE]);

export type FromLatexResult =
  | { ok: true; value: string }
  | { ok: false; error: string; partial?: string };

/** LaTeX command → Unicode Greek mapping (inverse of GREEK_TO_LATEX). */
const LATEX_TO_GREEK: Record<string, string> = {};
for (const [unicode, latex] of Object.entries(GREEK_TO_LATEX)) {
  LATEX_TO_GREEK[latex] = unicode;
}

/** Unsupported LaTeX structural commands that should trigger an error. */
const UNSUPPORTED_COMMANDS = new Set([
  "\\frac", "\\sqrt", "\\sum", "\\int", "\\prod", "\\lim",
]);

function latexToGreek(s: string): string {
  return s.replace(/\\(alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)\b/g,
    (match) => LATEX_TO_GREEK[match] ?? match);
}

/** Convert a LaTeX string into Chacana micro-syntax, preserving positional index order. */
export function fromLatex(input: string): FromLatexResult {
  // Check for unsupported commands first
  for (const cmd of UNSUPPORTED_COMMANDS) {
    if (input.includes(cmd)) {
      const name = cmd.slice(1); // remove backslash
      return { ok: false, error: `Unsupported LaTeX command: ${name}` };
    }
  }

  let s = input;

  // Strip \left and \right, keep the delimiter
  s = s.replace(/\\left\s*/g, "");
  s = s.replace(/\\right\s*/g, "");

  // Sentinels prevent the index regex from consuming the Lie derivative subscript.
  s = s.replace(/\\mathcal\{L\}_\{([^}]+)\}\s*/g, (_match, sub: string) => {
    return `__LIE__${latexToGreek(sub)}__LIESEP__`;
  });

  // Handle \det(...) → det(...)
  s = s.replace(/\\det/g, "det");

  // Handle \operatorname{Tr} → Tr
  s = s.replace(/\\operatorname\{Tr\}/g, "Tr");

  // Handle \star → star
  s = s.replace(/\\star/g, "star");

  // Handle \iota → i
  s = s.replace(/\\iota/g, "i");

  // Normalize operators
  s = s.replace(/\\cdot/g, "*");
  s = s.replace(/\\times/g, "*");
  s = s.replace(/\\wedge/g, "^");

  // Convert Greek LaTeX commands to Unicode
  s = latexToGreek(s);

  // Process tensors with indices: Name_{...}^{...} or Name^{...}_{...}
  // Also handles staggered: Name^{a}{}_{b}{}^{c}{}_{d}
  s = s.replace(/([A-Za-z\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9])((?:\s*\{\})*(?:\s*[_^]\{[^}]*\}(?:\s*\{\})*)+)/g,
    (_match, name: string, indexPart: string) => {
      const indices: string[] = [];
      // Match each ^{...} or _{...} group, skipping empty {} separators
      const groupRe = /([_^])\{([^}]*)\}/g;
      let m: RegExpExecArray | null;
      while ((m = groupRe.exec(indexPart)) !== null) {
        const variance = m[1] === "^" ? "^" : "_";
        const content = m[2].trim();
        if (content === "") continue; // empty separator
        // Split indices: if content has spaces, split on whitespace;
        // otherwise treat each character as a separate index label.
        const labels = content.includes(" ")
          ? content.split(/\s+/).filter(Boolean)
          : [...content].filter((ch) => ch.trim());
        for (const label of labels) {
          indices.push(variance + label);
        }
      }
      if (indices.length > 0) {
        return name + "{" + indices.join(" ") + "}";
      }
      return name;
    });

  // Restore Lie derivative sentinels. Body captures the next tensor name
  // plus optional brace-enclosed indices (which may contain spaces).
  s = s.replace(/__LIE__(\S+?)__LIESEP__(\w+(?:\{[^}]*\})*)/g,
    (_match, sub: string, body: string) => {
      return `L(${sub.trim()}, ${body.trim()})`;
    });

  // Clean up whitespace
  s = s.replace(/\s+/g, " ").trim();
  // Remove spaces after ( and before )
  s = s.replace(/\(\s+/g, "(");
  s = s.replace(/\s+\)/g, ")");

  return { ok: true, value: s };
}

/** Convert a ValidationToken AST into a valid LaTeX string. */
export function toLatex(token: ValidationToken): string {
  const { head, args, indices, value } = token;

  // Number literal
  if (head === HEAD_NUMBER) {
    return value != null ? String(value) : "0";
  }

  // Negation: -<inner> (wrap compound expressions in parens)
  if (head === HEAD_NEGATE && args.length === 1) {
    const inner = args[0];
    const innerLatex = toLatex(inner);
    if (COMPOUND_HEADS.has(inner.head)) {
      return `-(${innerLatex})`;
    }
    return "-" + innerLatex;
  }

  // Addition: handles subtraction via Negate args (A + Negate(B) → A - B)
  if (head === HEAD_ADD) {
    const parts: string[] = [];
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (i > 0 && arg.head === HEAD_NEGATE && arg.args.length === 1) {
        parts.push(" - " + toLatex(arg.args[0]));
      } else if (i === 0) {
        parts.push(toLatex(arg));
      } else {
        parts.push(" + " + toLatex(arg));
      }
    }
    return parts.join("");
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
