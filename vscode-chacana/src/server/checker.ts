/**
 * Static type checker for Chacana AST.
 * Ports src/chacana/checker.py to TypeScript.
 *
 * Key difference from Python: collects ALL errors instead of throwing
 * on the first one, which is the expected LSP behavior.
 */

import {
  type ChacanaIndex,
  type ValidationToken,
  type SourceRange,
  Variance,
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
} from "./ast.js";
import type { GlobalContext } from "./context.js";

export interface CheckerDiagnostic {
  message: string;
  range: SourceRange | null;
  code: string;
}

// ── Helpers ────────────────────────────────────────────────────────

function freeIndices(token: ValidationToken): ChacanaIndex[] {
  if (token.head === HEAD_ADD) {
    return token.args.length > 0 ? freeIndices(token.args[0]) : [];
  }
  if (token.head === HEAD_NEGATE) {
    return token.args.length > 0 ? freeIndices(token.args[0]) : [];
  }
  if (token.head === HEAD_MULTIPLY) {
    const all: ChacanaIndex[] = [];
    for (const arg of token.args) all.push(...freeIndices(arg));
    return removeContracted(all);
  }
  if (token.head === HEAD_WEDGE) {
    const all: ChacanaIndex[] = [];
    for (const arg of token.args) all.push(...freeIndices(arg));
    return all;
  }
  if (token.head === HEAD_EXTERIOR_DERIVATIVE) {
    return token.args.length > 0 ? freeIndices(token.args[0]) : [];
  }
  if (token.head === HEAD_NUMBER) return [];
  return [...token.indices];
}

function removeContracted(indices: ChacanaIndex[]): ChacanaIndex[] {
  const free: ChacanaIndex[] = [];
  const consumed = new Set<number>();
  for (let i = 0; i < indices.length; i++) {
    if (consumed.has(i)) continue;
    let foundPair = false;
    for (let j = i + 1; j < indices.length; j++) {
      if (consumed.has(j)) continue;
      if (
        indices[i].label === indices[j].label &&
        indices[i].indexType === indices[j].indexType &&
        indices[i].variance !== indices[j].variance
      ) {
        consumed.add(i);
        consumed.add(j);
        foundPair = true;
        break;
      }
    }
    if (!foundPair) free.push(indices[i]);
  }
  return free;
}

function getAllIndices(token: ValidationToken): ChacanaIndex[] {
  if (token.head === HEAD_ADD || token.head === HEAD_NEGATE) {
    return token.args.length > 0 ? getAllIndices(token.args[0]) : [];
  }
  if (token.head === HEAD_MULTIPLY || token.head === HEAD_WEDGE) {
    const result: ChacanaIndex[] = [];
    for (const arg of token.args) result.push(...getAllIndices(arg));
    return result;
  }
  if (token.head === HEAD_NUMBER) return [];
  return [...token.indices];
}

function resolveRank(
  token: ValidationToken,
  ctx: GlobalContext,
): number | null {
  if (token.indices.length > 0) return token.indices.length;
  const decl = ctx.tensors.get(token.head);
  return decl?.rank ?? null;
}

function resolveIndexPattern(
  token: ValidationToken,
  ctx: GlobalContext,
): Variance[] | null {
  if (token.indices.length > 0) return token.indices.map((i) => i.variance);
  const decl = ctx.tensors.get(token.head);
  return decl?.indexPattern.length ? [...decl.indexPattern] : null;
}

function isVector(
  token: ValidationToken,
  ctx: GlobalContext,
): boolean | null {
  const rank = resolveRank(token, ctx);
  if (rank == null) return null;
  if (rank !== 1) return false;
  const pattern = resolveIndexPattern(token, ctx);
  if (pattern == null) return null;
  return pattern[0] === Variance.Contra;
}

function formatIndices(indices: ChacanaIndex[]): string {
  if (indices.length === 0) return "{}";
  const parts = indices.map(
    (i) => `${i.variance === Variance.Contra ? "^" : "_"}${i.label}`,
  );
  return `{${parts.join(" ")}}`;
}

// ── Rule 1: Contraction ────────────────────────────────────────────

function checkContraction(
  token: ValidationToken,
  ctx: GlobalContext | null,
  diags: CheckerDiagnostic[],
): void {
  if (token.head === HEAD_MULTIPLY || token.head === HEAD_WEDGE) {
    const allIdx: ChacanaIndex[] = [];
    for (const arg of token.args) {
      checkContraction(arg, ctx, diags);
      allIdx.push(...getAllIndices(arg));
    }

    if (token.head === HEAD_MULTIPLY) {
      const byLabel = new Map<string, ChacanaIndex[]>();
      for (const idx of allIdx) {
        const group = byLabel.get(idx.label) ?? [];
        group.push(idx);
        byLabel.set(idx.label, group);
      }
      for (const [label, group] of byLabel) {
        if (group.length === 2) {
          if (group[0].indexType !== group[1].indexType) {
            diags.push({
              message: `Contraction index '${label}' has mismatched index type: ${group[0].indexType} vs ${group[1].indexType}`,
              range: token.range,
              code: "chacana/contraction",
            });
          } else if (group[0].variance === group[1].variance) {
            if (ctx?.activeMetric) continue;
            diags.push({
              message: `Contraction index '${label}' appears twice with same variance (${group[0].variance})`,
              range: token.range,
              code: "chacana/contraction",
            });
          }
        } else if (group.length > 2) {
          diags.push({
            message: `Index '${label}' appears ${group.length} times (expected at most 2)`,
            range: token.range,
            code: "chacana/contraction",
          });
        }
      }
    }
  } else if (token.head === HEAD_ADD || token.args.length > 0) {
    for (const arg of token.args) checkContraction(arg, ctx, diags);
  }
}

// ── Rule 2: Free Index Invariance ──────────────────────────────────

function checkFreeIndexInvariance(
  token: ValidationToken,
  diags: CheckerDiagnostic[],
): void {
  if (token.head === HEAD_ADD && token.args.length >= 2) {
    const ref = freeIndices(token.args[0]);
    const refCounted = countIndices(ref);
    for (let i = 1; i < token.args.length; i++) {
      const argFree = freeIndices(token.args[i]);
      const argCounted = countIndices(argFree);
      if (!mapsEqual(refCounted, argCounted)) {
        diags.push({
          message: `Free index mismatch in sum: term 0 has ${formatIndices(ref)}, term ${i} has ${formatIndices(argFree)}`,
          range: token.range,
          code: "chacana/free-index",
        });
      }
    }
  }
  for (const arg of token.args) checkFreeIndexInvariance(arg, diags);
}

function countIndices(indices: ChacanaIndex[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const idx of indices) {
    const key = `${idx.label}:${idx.variance}`;
    m.set(key, (m.get(key) ?? 0) + 1);
  }
  return m;
}

function mapsEqual(a: Map<string, number>, b: Map<string, number>): boolean {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) {
    if (b.get(k) !== v) return false;
  }
  return true;
}

// ── Rule 3: Symmetry ───────────────────────────────────────────────

function checkSymmetry(
  token: ValidationToken,
  ctx: GlobalContext | null,
  diags: CheckerDiagnostic[],
): void {
  for (const groupKey of ["symmetrized_groups", "antisymmetrized_groups"]) {
    const groups = groupKey === "symmetrized_groups"
      ? token.metadata.symmetrized_groups
      : token.metadata.antisymmetrized_groups;
    const kind = groupKey.includes("anti") ? "anti-symmetrization" : "symmetrization";
    for (const group of groups) {
      if (group.length < 2) continue;
      const ref = token.indices[group[0]];
      for (let p = 1; p < group.length; p++) {
        const other = token.indices[group[p]];
        if (ref.variance !== other.variance) {
          diags.push({
            message: `Variance mismatch in ${kind}: index '${ref.label}' (${ref.variance}) vs '${other.label}' (${other.variance})`,
            range: token.range,
            code: "chacana/symmetry",
          });
        }
        if (ref.indexType !== other.indexType) {
          diags.push({
            message: `Index type mismatch in ${kind}: index '${ref.label}' (${ref.indexType}) vs '${other.label}' (${other.indexType})`,
            range: token.range,
            code: "chacana/symmetry",
          });
        }
      }
    }
  }

  if (ctx != null) {
    const decl = ctx.tensors.get(token.head);
    if (decl && token.indices.length > 0) {
      for (const sym of decl.symmetries) {
        const positions = sym.indices.map((i) => i - 1);
        if (positions.every((p) => p >= 0 && p < token.indices.length)) {
          const ref = token.indices[positions[0]];
          for (let pi = 1; pi < positions.length; pi++) {
            const other = token.indices[positions[pi]];
            if (ref.variance !== other.variance) {
              diags.push({
                message: `Variance mismatch in declared symmetry of '${token.head}': slot ${positions[0] + 1} (${ref.variance}) vs slot ${positions[pi] + 1} (${other.variance})`,
                range: token.range,
                code: "chacana/symmetry",
              });
            }
          }
        }
      }
    }
  }

  for (const arg of token.args) checkSymmetry(arg, ctx, diags);
}

// ── Rule 4: Rank ───────────────────────────────────────────────────

function checkRank(
  token: ValidationToken,
  ctx: GlobalContext,
  diags: CheckerDiagnostic[],
): void {
  if (
    token.head === HEAD_ADD ||
    token.head === HEAD_MULTIPLY ||
    token.head === HEAD_WEDGE
  ) {
    for (const arg of token.args) checkRank(arg, ctx, diags);
    return;
  }
  if (token.head === HEAD_NUMBER) return;
  if (token.args.length > 0) {
    for (const arg of token.args) checkRank(arg, ctx, diags);
  }

  const decl = ctx.tensors.get(token.head);
  if (!decl) return;

  if (token.indices.length > 0 && token.indices.length !== decl.rank) {
    diags.push({
      message: `Tensor '${token.head}' declared with rank ${decl.rank}, but used with ${token.indices.length} indices`,
      range: token.range,
      code: "chacana/rank",
    });
  }

  if (token.indices.length > 0 && decl.indexPattern.length > 0) {
    for (let i = 0; i < Math.min(token.indices.length, decl.indexPattern.length); i++) {
      if (token.indices[i].variance !== decl.indexPattern[i]) {
        diags.push({
          message: `Tensor '${token.head}' index ${i}: expected ${decl.indexPattern[i]}, got ${token.indices[i].variance}`,
          range: token.range,
          code: "chacana/rank",
        });
      }
    }
  }
}

// ── Rule 5: Operator Constraints ───────────────────────────────────

function checkOperators(
  token: ValidationToken,
  ctx: GlobalContext,
  diags: CheckerDiagnostic[],
): void {
  if (token.head === HEAD_HODGE_STAR && !ctx.activeMetric) {
    diags.push({
      message: "Hodge star operator requires an active_metric in the context",
      range: token.range,
      code: "chacana/operator",
    });
  }

  if (token.head === HEAD_INTERIOR_PRODUCT && token.args.length >= 2) {
    const vecCheck = isVector(token.args[0], ctx);
    if (vecCheck === false) {
      diags.push({
        message: "Interior product first argument must be a vector field (rank 1 contravariant)",
        range: token.range,
        code: "chacana/operator",
      });
    }
    const secondRank = resolveRank(token.args[1], ctx);
    if (secondRank != null && secondRank === 0) {
      diags.push({
        message: "Interior product is undefined for 0-forms (rank 0)",
        range: token.range,
        code: "chacana/operator",
      });
    }
  }

  if (token.head === HEAD_LIE_DERIVATIVE && token.args.length >= 1) {
    const vecCheck = isVector(token.args[0], ctx);
    if (vecCheck === false) {
      diags.push({
        message: "Lie derivative first argument must be a vector field (rank 1 contravariant)",
        range: token.range,
        code: "chacana/operator",
      });
    }
  }

  if (token.head === HEAD_TRACE && token.args.length >= 1) {
    const rank = resolveRank(token.args[0], ctx);
    if (rank != null && rank < 2) {
      diags.push({
        message: `Trace requires a tensor of rank >= 2, but argument has rank ${rank}`,
        range: token.range,
        code: "chacana/operator",
      });
    }
  }

  if (token.head === HEAD_DETERMINANT && token.args.length >= 1) {
    const rank = resolveRank(token.args[0], ctx);
    if (rank != null && rank !== 2) {
      diags.push({
        message: `Determinant requires a rank-2 tensor, but argument has rank ${rank}`,
        range: token.range,
        code: "chacana/operator",
      });
    }
  }

  if (token.head === HEAD_INVERSE && token.args.length >= 1) {
    const rank = resolveRank(token.args[0], ctx);
    if (rank != null && rank !== 2) {
      diags.push({
        message: `Inverse requires a rank-2 tensor, but argument has rank ${rank}`,
        range: token.range,
        code: "chacana/operator",
      });
    }
  }

  for (const arg of token.args) checkOperators(arg, ctx, diags);
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Run all 5 checker rules. Returns an array of diagnostics (empty if valid).
 */
export function checkAll(
  token: ValidationToken,
  ctx: GlobalContext | null = null,
): CheckerDiagnostic[] {
  const diags: CheckerDiagnostic[] = [];
  checkContraction(token, ctx, diags);
  checkFreeIndexInvariance(token, diags);
  checkSymmetry(token, ctx, diags);
  if (ctx) {
    checkRank(token, ctx, diags);
    checkOperators(token, ctx, diags);
  }
  return diags;
}
