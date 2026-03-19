import { describe, it, expect, beforeAll } from "vitest";
import { initParser, createParser, parse } from "../../src/server/parser.js";
import { buildAST } from "../../src/server/astBuilder.js";
import { checkAll } from "../../src/server/checker.js";
import { loadContext, type GlobalContext } from "../../src/server/context.js";
import type TreeSitterType from "web-tree-sitter";

let parser: TreeSitterType;

beforeAll(async () => {
  await initParser();
  parser = createParser();
});

function check(expr: string, ctx: GlobalContext | null = null) {
  const tree = parse(parser, expr);
  const ast = buildAST(tree.rootNode);
  if (!ast) return [{ message: "Parse error", range: null, code: "parse" }];
  return checkAll(ast, ctx);
}

const basicCtx = loadContext(`
[manifold.M]
dimension = 4

[tensor.R]
manifold = "M"
rank = 4
index_pattern = ["Contra", "Covar", "Covar", "Covar"]

[tensor.T]
manifold = "M"
rank = 2
index_pattern = ["Contra", "Covar"]

[tensor.A]
manifold = "M"
rank = 1
index_pattern = ["Covar"]

[tensor.B]
manifold = "M"
rank = 1
index_pattern = ["Contra"]
`);

const metricCtx = loadContext(`
[strategy]
active_metric = "g"

[manifold.M]
dimension = 4

[tensor.A]
manifold = "M"
rank = 1
index_pattern = ["Covar"]

[tensor.g]
manifold = "M"
rank = 2
index_pattern = ["Covar", "Covar"]
`);

const diffgeomCtx = loadContext(`
[strategy]
active_metric = "g"

[manifold.M]
dimension = 4

[tensor.X]
manifold = "M"
rank = 1
index_pattern = ["Contra"]

[tensor.omega]
manifold = "M"
rank = 1
index_pattern = ["Covar"]

[tensor.f]
manifold = "M"
rank = 0

[tensor.g]
manifold = "M"
rank = 2
index_pattern = ["Covar", "Covar"]

[tensor.T]
manifold = "M"
rank = 2
index_pattern = ["Contra", "Covar"]

[tensor.S]
manifold = "M"
rank = 3
index_pattern = ["Covar", "Covar", "Covar"]
`);

describe("checker", () => {
  // Rule 1: Contraction
  it("accepts valid contraction", () => {
    expect(check("A{_a} * B{^a}", basicCtx)).toHaveLength(0);
  });

  it("rejects same-variance contraction without metric", () => {
    const diags = check("A{_a} * B{_a}", basicCtx);
    expect(diags.length).toBeGreaterThan(0);
    expect(diags[0].code).toBe("chacana/contraction");
  });

  it("allows same-variance contraction with active metric", () => {
    expect(check("A{_a} * A{_a}", metricCtx)).toHaveLength(0);
  });

  // Rule 2: Free index invariance
  it("accepts matching free indices in sum", () => {
    // Use no context to test structural rule only
    expect(check("A{^a} + B{^a}")).toHaveLength(0);
  });

  it("rejects mismatched free indices in sum", () => {
    const diags = check("A{^a} + B{^b}");
    expect(diags.some((d) => d.code === "chacana/free-index")).toBe(true);
  });

  // Rule 4: Rank
  it("accepts correct rank usage", () => {
    expect(check("R{^a _b _c _d}", basicCtx)).toHaveLength(0);
  });

  it("rejects wrong rank", () => {
    const diags = check("R{^a _b}", basicCtx);
    expect(diags.some((d) => d.code === "chacana/rank")).toBe(true);
  });

  it("rejects wrong variance pattern", () => {
    const diags = check("R{_a _b _c _d}", basicCtx);
    expect(diags.some((d) => d.code === "chacana/rank")).toBe(true);
  });

  // Rule 5: Operators
  it("rejects Hodge star without metric", () => {
    const noMetricCtx = loadContext(`
[manifold.M]
dimension = 4

[tensor.omega]
manifold = "M"
rank = 1
index_pattern = ["Covar"]
`);
    const diags = check("hodge(omega)", noMetricCtx);
    expect(diags.some((d) => d.code === "chacana/operator")).toBe(true);
  });

  it("accepts Hodge star with metric", () => {
    expect(check("hodge(omega)", diffgeomCtx)).toHaveLength(0);
  });

  it("rejects Lie derivative with non-vector first arg", () => {
    const diags = check("L(omega, T{^a _b})", diffgeomCtx);
    expect(diags.some((d) => d.code === "chacana/operator")).toBe(true);
  });

  it("accepts Lie derivative with vector first arg", () => {
    expect(check("L(X, T{^a _b})", diffgeomCtx)).toHaveLength(0);
  });

  it("rejects Trace of rank 0", () => {
    const diags = check("Tr(f)", diffgeomCtx);
    expect(diags.some((d) => d.code === "chacana/operator")).toBe(true);
  });

  it("rejects Determinant of rank != 2", () => {
    const diags = check("det(S)", diffgeomCtx);
    expect(diags.some((d) => d.code === "chacana/operator")).toBe(true);
  });

  it("rejects Inverse of rank != 2", () => {
    const diags = check("inv(S)", diffgeomCtx);
    expect(diags.some((d) => d.code === "chacana/operator")).toBe(true);
  });

  it("accepts valid expressions without context", () => {
    expect(check("A + B")).toHaveLength(0);
    expect(check("A{_a} * B{^a}")).toHaveLength(0);
    expect(check("d(omega)")).toHaveLength(0);
  });

  // Complex expressions
  it("accepts Bianchi identity structure", () => {
    expect(check("R{^a _b _c _d} + R{^a _c _d _b} + R{^a _d _b _c}")).toHaveLength(0);
  });

  it("accepts Gauss-Bonnet structure", () => {
    expect(check("R * R + R{_a _b} * R{^a ^b}")).toHaveLength(0);
  });
});
