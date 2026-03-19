import { describe, it, expect, beforeAll } from "vitest";
import { initParser, createParser, parse } from "../../src/server/parser.js";
import { extractSyntaxErrors } from "../../src/server/syntaxErrors.js";
import type TreeSitterType from "web-tree-sitter";

let parser: TreeSitterType;

beforeAll(async () => {
  await initParser();
  parser = createParser();
});

describe("syntax error extraction", () => {
  it("returns no errors for valid expression", () => {
    const tree = parse(parser, "R{^a _b _c _d}");
    const errors = extractSyntaxErrors(tree.rootNode);
    expect(errors).toHaveLength(0);
  });

  it("returns no errors for bare identifier", () => {
    const tree = parse(parser, "A");
    expect(extractSyntaxErrors(tree.rootNode)).toHaveLength(0);
  });

  it("returns no errors for sum", () => {
    const tree = parse(parser, "A + B");
    expect(extractSyntaxErrors(tree.rootNode)).toHaveLength(0);
  });

  it("returns no errors for functional operator", () => {
    const tree = parse(parser, "d(omega){_a _b}");
    expect(extractSyntaxErrors(tree.rootNode)).toHaveLength(0);
  });

  it("returns no errors for symmetrization with closing variance", () => {
    const tree = parse(parser, "T{_( a b _)}");
    expect(extractSyntaxErrors(tree.rootNode)).toHaveLength(0);
  });

  it("returns no errors for complex expression", () => {
    const tree = parse(parser, "R{^a _b _c _d} * g{^b ^d} + T{^a _c}");
    expect(extractSyntaxErrors(tree.rootNode)).toHaveLength(0);
  });

  it("detects empty braces", () => {
    const tree = parse(parser, "R{}");
    const errors = extractSyntaxErrors(tree.rootNode);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("detects trailing operator", () => {
    const tree = parse(parser, "A +");
    const errors = extractSyntaxErrors(tree.rootNode);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("detects unclosed brace", () => {
    const tree = parse(parser, "T{^a _b");
    const errors = extractSyntaxErrors(tree.rootNode);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("detects invalid variance marker", () => {
    const tree = parse(parser, "R{?a}");
    const errors = extractSyntaxErrors(tree.rootNode);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("detects double variance marker", () => {
    const tree = parse(parser, "T{^^a}");
    const errors = extractSyntaxErrors(tree.rootNode);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("reports correct position for trailing operator", () => {
    const tree = parse(parser, "A +");
    const errors = extractSyntaxErrors(tree.rootNode);
    expect(errors.length).toBeGreaterThan(0);
    // The error should be near the end of the input
    const err = errors[0];
    expect(err.startLine).toBe(0);
  });

  it("returns no errors for all functional operators", () => {
    const exprs = [
      "d(omega)", "L(X, T)", "Tr(T)", "det(g)",
      "inv(M)", "star(F)", "hodge(omega)", "i(X, omega)",
    ];
    for (const expr of exprs) {
      const tree = parse(parser, expr);
      const errors = extractSyntaxErrors(tree.rootNode);
      expect(errors, `Expected no errors for: ${expr}`).toHaveLength(0);
    }
  });

  it("returns no errors for perturbation and commutator", () => {
    for (const expr of ["@2(A + B)", "[A, B]"]) {
      const tree = parse(parser, expr);
      expect(extractSyntaxErrors(tree.rootNode), expr).toHaveLength(0);
    }
  });

  it("returns no errors for derivatives", () => {
    for (const expr of ["T{;a}", "T{,b}", "T{;a ,b}", "T{^a _b ;c}"]) {
      const tree = parse(parser, expr);
      expect(extractSyntaxErrors(tree.rootNode), expr).toHaveLength(0);
    }
  });

  it("returns no errors for Greek identifiers", () => {
    const tree = parse(parser, "Γ{^α _β _γ}");
    expect(extractSyntaxErrors(tree.rootNode)).toHaveLength(0);
  });
});
