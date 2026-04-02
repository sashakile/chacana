import { describe, it, expect } from "vitest";
import {
  Variance,
  IndexType,
  makeToken,
  emptyMetadata,
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
  type ChacanaIndex,
  type TokenMetadata,
} from "../../src/server/ast.js";
import { toLatex, fromLatex } from "../../src/server/latex.js";

// --- helpers ---

function idx(
  label: string,
  variance: Variance,
  opts?: { isDerivative?: boolean; derivativeType?: "semicolon" | "comma" | null },
): ChacanaIndex {
  return {
    label,
    variance,
    indexType: /[\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9]/.test(label)
      ? IndexType.Greek
      : IndexType.Latin,
    isDerivative: opts?.isDerivative ?? false,
    derivativeType: opts?.derivativeType ?? null,
  };
}

function contra(label: string): ChacanaIndex {
  return idx(label, Variance.Contra);
}

function covar(label: string): ChacanaIndex {
  return idx(label, Variance.Covar);
}

// --- toLatex tests ---

describe("toLatex", () => {
  it("transforms a scalar identifier", () => {
    const token = makeToken("x");
    expect(toLatex(token)).toBe("x");
  });

  it("transforms a numeric coefficient with tensor", () => {
    // 2 * T{^a _b}
    const two = makeToken(HEAD_NUMBER, [], [], 2);
    const T = makeToken("T", [], [contra("a"), covar("b")]);
    const product = makeToken(HEAD_MULTIPLY, [two, T]);
    expect(toLatex(product)).toBe("2 T^{a}{}_{b}");
  });

  it("transforms standard Riemann tensor R{^a _b _c _d}", () => {
    const R = makeToken("R", [], [
      contra("a"),
      covar("b"),
      covar("c"),
      covar("d"),
    ]);
    expect(toLatex(R)).toBe("R^{a}{}_{b c d}");
  });

  it("transforms Greek indices T{^α _β}", () => {
    const T = makeToken("T", [], [contra("α"), covar("β")]);
    expect(toLatex(T)).toBe("T^{\\alpha}{}_{\\beta}");
  });

  it("transforms staggered mixed-variance indices", () => {
    // R{^a _b ^c _d} → R^{a}{}_{b}{}^{c}{}_{d}
    const R = makeToken("R", [], [
      contra("a"),
      covar("b"),
      contra("c"),
      covar("d"),
    ]);
    expect(toLatex(R)).toBe("R^{a}{}_{b}{}^{c}{}_{d}");
  });

  it("transforms Lie derivative L(X, g{_a _b})", () => {
    const X = makeToken("X");
    const g = makeToken("g", [], [covar("a"), covar("b")]);
    const lie = makeToken(HEAD_LIE_DERIVATIVE, [X, g]);
    expect(toLatex(lie)).toBe("\\mathcal{L}_{X} g_{a b}");
  });

  it("transforms determinant det(g{_a _b})", () => {
    const g = makeToken("g", [], [covar("a"), covar("b")]);
    const det = makeToken(HEAD_DETERMINANT, [g]);
    expect(toLatex(det)).toBe("\\det(g_{a b})");
  });

  it("transforms covariant derivative T{_a ;b}", () => {
    const T = makeToken("T", [], [
      covar("a"),
      idx("b", Variance.Covar, { isDerivative: true, derivativeType: "semicolon" }),
    ]);
    expect(toLatex(T)).toBe("T_{a ;\\! b}");
  });

  it("transforms negation -T{^a _b}", () => {
    const T = makeToken("T", [], [contra("a"), covar("b")]);
    const neg = makeToken(HEAD_NEGATE, [T]);
    expect(toLatex(neg)).toBe("-T^{a}{}_{b}");
  });

  it("transforms nested functional operators d(star(omega))", () => {
    const omega = makeToken("ω");
    const star = makeToken(HEAD_HODGE_STAR, [omega]);
    const ext = makeToken(HEAD_EXTERIOR_DERIVATIVE, [star]);
    expect(toLatex(ext)).toBe("d(\\star(\\omega))");
  });

  it("transforms symmetrized indices T{_(a _b)}", () => {
    const meta: TokenMetadata = {
      symmetrized_groups: [[0, 1]],
      antisymmetrized_groups: [],
      order: null,
    };
    const T = makeToken("T", [], [covar("a"), covar("b")], null, meta);
    expect(toLatex(T)).toBe("T_{(a b)}");
  });

  it("transforms antisymmetrized indices T{_[a _b]}", () => {
    const meta: TokenMetadata = {
      symmetrized_groups: [],
      antisymmetrized_groups: [[0, 1]],
      order: null,
    };
    const T = makeToken("T", [], [covar("a"), covar("b")], null, meta);
    expect(toLatex(T)).toBe("T_{[a b]}");
  });

  it("transforms addition A + B", () => {
    const A = makeToken("A");
    const B = makeToken("B");
    const sum = makeToken(HEAD_ADD, [A, B]);
    expect(toLatex(sum)).toBe("A + B");
  });

  it("transforms wedge product", () => {
    const A = makeToken("A");
    const B = makeToken("B");
    const wedge = makeToken(HEAD_WEDGE, [A, B]);
    expect(toLatex(wedge)).toBe("A \\wedge B");
  });

  it("transforms exterior derivative d(omega)", () => {
    const omega = makeToken("ω");
    const ext = makeToken(HEAD_EXTERIOR_DERIVATIVE, [omega]);
    expect(toLatex(ext)).toBe("d(\\omega)");
  });

  it("transforms trace Tr(T)", () => {
    const T = makeToken("T");
    const tr = makeToken(HEAD_TRACE, [T]);
    expect(toLatex(tr)).toBe("\\operatorname{Tr}(T)");
  });

  it("transforms inverse inv(g)", () => {
    const g = makeToken("g");
    const inv = makeToken(HEAD_INVERSE, [g]);
    expect(toLatex(inv)).toBe("g^{-1}");
  });

  it("transforms Hodge star star(omega)", () => {
    const omega = makeToken("ω");
    const star = makeToken(HEAD_HODGE_STAR, [omega]);
    expect(toLatex(star)).toBe("\\star(\\omega)");
  });

  it("transforms interior product i(X, omega)", () => {
    const X = makeToken("X");
    const omega = makeToken("ω");
    const ip = makeToken(HEAD_INTERIOR_PRODUCT, [X, omega]);
    expect(toLatex(ip)).toBe("\\iota_{X} \\omega");
  });

  it("transforms a bare number", () => {
    const num = makeToken(HEAD_NUMBER, [], [], 42);
    expect(toLatex(num)).toBe("42");
  });
});

// --- fromLatex tests ---

describe("fromLatex", () => {
  it("imports basic tensor notation preserving positional order", () => {
    const result = fromLatex("R_{abc}^{d}");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("R{_a _b _c ^d}");
    }
  });

  it("imports tensor with superscript first", () => {
    const result = fromLatex("T^{a}{}_{b}");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("T{^a _b}");
    }
  });

  it("imports staggered indices", () => {
    const result = fromLatex("R^{a}{}_{b}{}^{c}{}_{d}");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("R{^a _b ^c _d}");
    }
  });

  it("imports Greek LaTeX commands as Unicode", () => {
    const result = fromLatex("T^{\\alpha}{}_{\\beta}");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("T{^α _β}");
    }
  });

  it("imports basic arithmetic with operator normalization", () => {
    const result = fromLatex("A + B \\cdot C");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("A + B * C");
    }
  });

  it("normalizes \\times to *", () => {
    const result = fromLatex("A \\times B");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("A * B");
    }
  });

  it("imports scalar identifiers without indices", () => {
    const result = fromLatex("x");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("x");
    }
  });

  it("imports \\omega as Unicode ω", () => {
    const result = fromLatex("\\omega");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("ω");
    }
  });

  it("strips \\left and \\right delimiters", () => {
    const result = fromLatex("\\left( A + B \\right)");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("(A + B)");
    }
  });

  it("returns error for unsupported \\frac", () => {
    const result = fromLatex("\\frac{1}{2} R_{abcd}");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("frac");
    }
  });

  it("returns error for \\sqrt", () => {
    const result = fromLatex("\\sqrt{x}");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("sqrt");
    }
  });

  it("imports \\wedge operator", () => {
    const result = fromLatex("A \\wedge B");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("A ^ B");
    }
  });

  it("imports \\det operator", () => {
    const result = fromLatex("\\det(g_{ab})");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("det(g{_a _b})");
    }
  });

  it("imports \\mathcal{L} as Lie derivative", () => {
    const result = fromLatex("\\mathcal{L}_{X} g_{ab}");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("L(X, g{_a _b})");
    }
  });

  it("imports \\star operator", () => {
    const result = fromLatex("\\star(\\omega)");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("star(ω)");
    }
  });
});
