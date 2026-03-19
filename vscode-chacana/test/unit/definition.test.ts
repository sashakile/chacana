import { describe, it, expect, beforeAll } from "vitest";
import { initParser, createParser, parse } from "../../src/server/parser.js";
import { getDefinition } from "../../src/server/definition.js";
import type TreeSitterType from "web-tree-sitter";

let parser: TreeSitterType;

beforeAll(async () => {
  await initParser();
  parser = createParser();
});

const tensorLines = new Map([
  ["R", 5],
  ["T", 11],
  ["g", 16],
]);
const tomlPath = "/path/to/context.toml";

describe("go-to-definition", () => {
  it("returns TOML location for tensor name", () => {
    // "R{^a _b _c _d}" — click on R at col 0
    const tree = parse(parser, "R{^a _b _c _d}");
    const def = getDefinition(tree.rootNode, 0, 0, tomlPath, tensorLines);
    expect(def).toEqual({ uri: tomlPath, line: 5 });
  });

  it("returns correct line for different tensors", () => {
    const tree = parse(parser, "g{_a _b}");
    const def = getDefinition(tree.rootNode, 0, 0, tomlPath, tensorLines);
    expect(def).toEqual({ uri: tomlPath, line: 16 });
  });

  it("returns null for unknown tensor", () => {
    const tree = parse(parser, "Z{^a}");
    const def = getDefinition(tree.rootNode, 0, 0, tomlPath, tensorLines);
    expect(def).toBeNull();
  });

  it("returns null for functional op names", () => {
    const tree = parse(parser, "d(omega)");
    const def = getDefinition(tree.rootNode, 0, 0, tomlPath, tensorLines);
    expect(def).toBeNull();
  });

  it("returns null for index names", () => {
    const tree = parse(parser, "R{^a _b}");
    // col 3 is 'a' (index, not tensor name)
    const def = getDefinition(tree.rootNode, 0, 3, tomlPath, tensorLines);
    expect(def).toBeNull();
  });

  it("returns null without toml path", () => {
    const tree = parse(parser, "R{^a _b _c _d}");
    const def = getDefinition(tree.rootNode, 0, 0, null, null);
    expect(def).toBeNull();
  });
});
