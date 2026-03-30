import { describe, it, expect, beforeAll } from "vitest";
import { initParser, createParser, parse } from "../../src/server/parser.js";
import { getHover } from "../../src/server/hover.js";
import { loadContext } from "../../src/server/context.js";
import type TreeSitterType from "web-tree-sitter";

let parser: TreeSitterType;

beforeAll(async () => {
  await initParser();
  parser = createParser();
});

const ctx = loadContext(`
[manifold.M]
dimension = 4

[tensor.R]
manifold = "M"
rank = 4
index_pattern = ["Contra", "Covar", "Covar", "Covar"]

[tensor.g]
manifold = "M"
rank = 2
index_pattern = ["Covar", "Covar"]
symmetries = [{indices = [1, 2], type = "Symmetric"}]
`);

function hover(expr: string, col: number) {
  const tree = parse(parser, expr);
  return getHover(tree.rootNode, 0, col, ctx);
}

describe("hover provider", () => {
  it("shows tensor info for declared tensor", () => {
    // "R{^a _b _c _d}" — hover on R at col 0
    const h = hover("R{^a _b _c _d}", 0);
    expect(h).toContain("**R**");
    expect(h).toContain("Rank: 4");
    expect(h).toContain("Contra");
  });

  it("shows symmetry info for symmetric tensor", () => {
    const h = hover("g{_a _b}", 0);
    expect(h).toContain("**g**");
    expect(h).toContain("Symmetric");
  });

  it("shows operator docs for functional op", () => {
    // "d(omega)" — hover on d at col 0
    const h = hover("d(omega)", 0);
    expect(h).toContain("Exterior derivative");
  });

  it("shows Lie derivative docs", () => {
    const h = hover("L(X, T)", 0);
    expect(h).toContain("Lie derivative");
  });

  it("shows Trace docs", () => {
    const h = hover("Tr(T)", 0);
    expect(h).toContain("Trace");
  });

  it("returns null for unknown identifier", () => {
    const h = hover("Z{^a}", 0);
    // Z not in context, and not a functional op
    expect(h).toBeNull();
  });

  it("returns null for index names", () => {
    // "R{^a _b}" — hover on 'a' at col 3
    const h = hover("R{^a _b}", 3);
    expect(h).toBeNull();
  });

  it("returns null without context", () => {
    const tree = parse(parser, "R{^a _b _c _d}");
    const h = getHover(tree.rootNode, 0, 0, null);
    expect(h).toBeNull();
  });

  it("does not crash when descendant is root-level anonymous node", () => {
    // Hover on a position that yields a root-level node (col way past end)
    const tree = parse(parser, "R{^a}");
    // Should return null, not throw
    expect(() => getHover(tree.rootNode, 0, 999, ctx)).not.toThrow();
  });

  it("returns hover info for tensor on second line of multi-line doc", () => {
    const tree = parse(parser, "A + B\ng{_a _b}");
    // Hover on 'g' at line 1, col 0
    const h = getHover(tree.rootNode, 1, 0, ctx);
    expect(h).toContain("**g**");
    expect(h).toContain("Rank: 2");
  });
});
