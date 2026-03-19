/**
 * web-tree-sitter wrapper for incremental parsing of Chacana expressions.
 */

import type TreeSitterType from "web-tree-sitter";
import { existsSync } from "fs";
import { join, resolve } from "path";

let TreeSitter: typeof TreeSitterType;
let chacanaLanguage: TreeSitterType.Language;
let initialized = false;

export type Tree = TreeSitterType.Tree;
export type SyntaxNode = TreeSitterType.SyntaxNode;
export type Point = TreeSitterType.Point;

/**
 * Resolve the WASM directory by probing candidate paths.
 *
 * Production (esbuild bundle): dist/server/server.js → __dirname is dist/server/,
 *   so dist/wasm/ is at join(__dirname, "..", "wasm").
 * Tests (vitest, unbundled): __dirname is src/server/,
 *   so wasm/ is at resolve(__dirname, "..", "..", "wasm").
 */
function resolveWasmDir(): string {
  const candidates = [
    join(__dirname, "..", "wasm"),             // bundled: dist/server → dist/wasm
    resolve(__dirname, "..", "..", "wasm"),     // test: src/server → wasm/
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, "tree-sitter.wasm"))) return dir;
  }
  throw new Error(
    `Cannot find tree-sitter.wasm in any candidate path: ${candidates.join(", ")}`,
  );
}

/**
 * Initialize web-tree-sitter and load the Chacana grammar.
 * Must be called once before any parsing.
 * @param wasmDir - optional override for the WASM directory path
 */
export async function initParser(wasmDir?: string): Promise<void> {
  if (initialized) return;

  // Dynamic import for web-tree-sitter (CJS compatible)
  const mod = await import("web-tree-sitter");
  TreeSitter = mod.default ?? mod;

  const dir = wasmDir ?? resolveWasmDir();
  await TreeSitter.init({
    locateFile: (path: string) => join(dir, path),
  });

  chacanaLanguage = await TreeSitter.Language.load(
    join(dir, "tree-sitter-chacana.wasm"),
  );
  initialized = true;
}

/** Create a new parser instance with the Chacana language set. */
export function createParser(): TreeSitterType {
  if (!initialized) throw new Error("Call initParser() first");
  const parser = new TreeSitter();
  parser.setLanguage(chacanaLanguage);
  return parser;
}

/** Parse source text, optionally with a previous tree for incremental update. */
export function parse(
  parser: TreeSitterType,
  source: string,
  oldTree?: Tree,
): Tree {
  return parser.parse(source, oldTree);
}
