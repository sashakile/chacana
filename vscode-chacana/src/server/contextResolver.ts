/**
 * Resolves the TOML GlobalContext for a .chcn file.
 *
 * Resolution order:
 *   1. `# context: <path>` directive in the first 5 lines of the file
 *   2. `chacana.toml` in the same directory, then parent directories
 */

import { readFileSync, existsSync, statSync } from "fs";
import { dirname, resolve, join } from "path";
import { URI } from "vscode-uri";
import { loadContext, type GlobalContext } from "./context.js";

export interface ResolvedContext {
  ctx: GlobalContext;
  tomlPath: string;
  /** Map of tensor name -> line number in the TOML file (0-based) */
  tensorLines: Map<string, number>;
}

interface CacheEntry {
  resolved: ResolvedContext;
  mtimeMs: number;
}

const cache = new Map<string, CacheEntry>();

const CONTEXT_DIRECTIVE_RE = /^#\s*context:\s*(.+)$/;

/**
 * Extract `# context: <path>` from the first few lines of a .chcn file.
 */
function extractDirective(source: string): string | null {
  const lines = source.split("\n").slice(0, 5);
  for (const line of lines) {
    const m = line.match(CONTEXT_DIRECTIVE_RE);
    if (m) return m[1].trim();
  }
  return null;
}

/**
 * Walk up directories looking for chacana.toml.
 */
function findSiblingToml(fileDir: string): string | null {
  let dir = fileDir;
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, "chacana.toml");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/**
 * Scan TOML text for `[tensor.X]` headers and record their line positions.
 */
function extractTensorLines(tomlText: string): Map<string, number> {
  const lines = tomlText.split("\n");
  const result = new Map<string, number>();
  const re = /^\[tensor\.(\w+)\]/;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(re);
    if (m) result.set(m[1], i);
  }
  return result;
}

/**
 * Resolve the GlobalContext for a .chcn document.
 * Returns null if no context is found.
 */
export function resolveContext(
  docUri: string,
  source: string,
): ResolvedContext | null {
  // 1. Try directive
  const directive = extractDirective(source);
  let tomlPath: string | null = null;

  if (directive) {
    const fileDir = dirname(URI.parse(docUri).fsPath);
    tomlPath = resolve(fileDir, directive);
  }

  // 2. Try sibling walk
  if (!tomlPath || !existsSync(tomlPath)) {
    const fileDir = dirname(URI.parse(docUri).fsPath);
    tomlPath = findSiblingToml(fileDir);
  }

  if (!tomlPath || !existsSync(tomlPath)) return null;

  // Check cache — validate mtime to catch out-of-workspace edits
  let mtimeMs: number;
  try {
    mtimeMs = statSync(tomlPath).mtimeMs;
  } catch {
    return null;
  }
  const cached = cache.get(tomlPath);
  if (cached && cached.mtimeMs === mtimeMs) return cached.resolved;

  try {
    const tomlText = readFileSync(tomlPath, "utf-8");
    const ctx = loadContext(tomlText);
    const tensorLines = extractTensorLines(tomlText);
    const resolved: ResolvedContext = { ctx, tomlPath, tensorLines };
    cache.set(tomlPath, { resolved, mtimeMs });
    return resolved;
  } catch {
    return null;
  }
}

/** Clear the context cache (called when TOML files change). */
export function invalidateContextCache(): void {
  cache.clear();
}
