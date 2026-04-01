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
  walkTokens,
} from "./ast.js";
import type { GlobalContext } from "./context.js";

export interface CheckerDiagnostic {
  message: string;
  range: SourceRange | null;
  code: string;
}

// ── Index analysis helpers (metric-aware) ─────────────────────────

function freeIndices(token: ValidationToken, metricAware: boolean = false): ChacanaIndex[] {
  if (token.head === HEAD_ADD) {
    return token.args.length > 0 ? freeIndices(token.args[0], metricAware) : [];
  }
  if (token.head === HEAD_NEGATE) {
    return token.args.length > 0 ? freeIndices(token.args[0], metricAware) : [];
  }
  if (token.head === HEAD_MULTIPLY) {
    const all: ChacanaIndex[] = [];
    for (const arg of token.args) all.push(...freeIndices(arg, metricAware));
    return removeContracted(all, metricAware);
  }
  if (token.head === HEAD_WEDGE) {
    const all: ChacanaIndex[] = [];
    for (const arg of token.args) all.push(...freeIndices(arg, metricAware));
    return all;
  }
  if (token.head === HEAD_EXTERIOR_DERIVATIVE) {
    return token.args.length > 0 ? freeIndices(token.args[0], metricAware) : [];
  }
  if (token.head === HEAD_NUMBER) return [];
  return [...token.indices];
}

function removeContracted(indices: ChacanaIndex[], metricAware: boolean = false): ChacanaIndex[] {
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
        (indices[i].variance !== indices[j].variance || metricAware)
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
  if (token.head === HEAD_ADD) {
    if (token.args.length === 0) return [];
    // Max-multiplicity union across all terms (fixes y74).
    const maxCounts = new Map<string, { idx: ChacanaIndex; count: number }>();
    for (const arg of token.args) {
      const argCounts = new Map<string, { idx: ChacanaIndex; count: number }>();
      for (const idx of getAllIndices(arg)) {
        const key = `${idx.label}:${idx.variance}:${idx.indexType}`;
        const entry = argCounts.get(key);
        if (entry) entry.count++;
        else argCounts.set(key, { idx, count: 1 });
      }
      for (const [key, { idx, count }] of argCounts) {
        const existing = maxCounts.get(key);
        if (!existing || count > existing.count) {
          maxCounts.set(key, { idx, count });
        }
      }
    }
    const result: ChacanaIndex[] = [];
    for (const { idx, count } of maxCounts.values()) {
      for (let i = 0; i < count; i++) result.push(idx);
    }
    return result;
  }
  if (token.head === HEAD_NEGATE) {
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
        } else if (
          token.head === HEAD_MULTIPLY &&
          group[0].variance === group[1].variance
        ) {
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
  } else {
    for (const arg of token.args) checkContraction(arg, ctx, diags);
  }
}

// ── Rule 2: Free Index Invariance ──────────────────────────────────

function checkFreeIndexInvariance(
  token: ValidationToken,
  ctx: GlobalContext | null,
  diags: CheckerDiagnostic[],
): void {
  const metricAware = !!(ctx?.activeMetric);
  for (const t of walkTokens(token)) {
    if (t.head !== HEAD_ADD || t.args.length < 2) continue;
    const ref = freeIndices(t.args[0], metricAware);
    const refCounted = countIndices(ref);
    for (let i = 1; i < t.args.length; i++) {
      const argFree = freeIndices(t.args[i], metricAware);
      const argCounted = countIndices(argFree);
      if (!mapsEqual(refCounted, argCounted)) {
        diags.push({
          message: `Free index mismatch in sum: term 0 has ${formatIndices(ref)}, term ${i} has ${formatIndices(argFree)}`,
          range: t.range,
          code: "chacana/free-index",
        });
      }
    }
  }
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
  for (const t of walkTokens(token)) {
    checkSymmetrySingle(t, ctx, diags);
  }
}

function validateSymmetryGroup(
  indices: ChacanaIndex[],
  positions: number[],
  label: string,
  range: SourceRange | null,
  diags: CheckerDiagnostic[],
): void {
  if (positions.length < 2) return;
  const ref = indices[positions[0]];
  for (let p = 1; p < positions.length; p++) {
    const other = indices[positions[p]];
    if (ref.variance !== other.variance) {
      diags.push({
        message: `Variance mismatch in ${label}: index '${ref.label}' (${ref.variance}) vs '${other.label}' (${other.variance})`,
        range,
        code: "chacana/symmetry",
      });
    }
    if (ref.indexType !== other.indexType) {
      diags.push({
        message: `Index type mismatch in ${label}: index '${ref.label}' (${ref.indexType}) vs '${other.label}' (${other.indexType})`,
        range,
        code: "chacana/symmetry",
      });
    }
  }
}

function checkSymmetrySingle(
  token: ValidationToken,
  ctx: GlobalContext | null,
  diags: CheckerDiagnostic[],
): void {
  for (const [kind, groups] of [
    ["symmetrization", token.metadata.symmetrized_groups],
    ["anti-symmetrization", token.metadata.antisymmetrized_groups],
  ] as const) {
    for (const group of groups) {
      validateSymmetryGroup(token.indices, group, kind, token.range, diags);
    }
  }

  if (ctx != null) {
    const decl = ctx.tensors.get(token.head);
    if (decl && token.indices.length > 0) {
      for (const sym of decl.symmetries) {
        const positions = sym.indices.map((i) => i - 1);
        if (positions.every((p) => p >= 0 && p < token.indices.length)) {
          validateSymmetryGroup(
            token.indices,
            positions,
            `declared symmetry of '${token.head}'`,
            token.range,
            diags,
          );
        }
      }
    }
  }
}

// ── Rule 4: Rank ───────────────────────────────────────────────────

const STRUCTURAL_HEADS = new Set([
  HEAD_ADD, HEAD_MULTIPLY, HEAD_WEDGE, HEAD_NEGATE, HEAD_NUMBER,
]);

function checkRank(
  token: ValidationToken,
  ctx: GlobalContext,
  diags: CheckerDiagnostic[],
): void {
  for (const t of walkTokens(token)) {
    if (STRUCTURAL_HEADS.has(t.head)) continue;
    const decl = ctx.tensors.get(t.head);
    if (!decl) continue;

    // Derivative indices (;e, ,a) are not part of the tensor's intrinsic rank
    const tensorIndices = t.indices.filter(idx => !idx.isDerivative);

    if (tensorIndices.length > 0 && tensorIndices.length !== decl.rank) {
      diags.push({
        message: `Tensor '${t.head}' declared with rank ${decl.rank}, but used with ${tensorIndices.length} indices`,
        range: t.range,
        code: "chacana/rank",
      });
    }

    if (tensorIndices.length > 0 && decl.indexPattern.length > 0 && !ctx.activeMetric) {
      for (let i = 0; i < Math.min(tensorIndices.length, decl.indexPattern.length); i++) {
        if (tensorIndices[i].variance !== decl.indexPattern[i]) {
          diags.push({
            message: `Tensor '${t.head}' index ${i}: expected ${decl.indexPattern[i]}, got ${tensorIndices[i].variance}`,
            range: t.range,
            code: "chacana/rank",
          });
        }
      }
    }
  }
}

// ── Rule 5: Operator Constraints ───────────────────────────────────

type OperatorCheck = (
  token: ValidationToken,
  ctx: GlobalContext,
  diags: CheckerDiagnostic[],
) => void;

function requiresMetric(
  token: ValidationToken,
  ctx: GlobalContext,
  diags: CheckerDiagnostic[],
): void {
  if (!ctx.activeMetric) {
    diags.push({
      message: "Hodge star operator requires an active_metric in the context",
      range: token.range,
      code: "chacana/operator",
    });
  }
}

function firstArgIsVector(opName: string): OperatorCheck {
  return (token, ctx, diags) => {
    if (token.args.length < 1) return;
    if (isVector(token.args[0], ctx) === false) {
      diags.push({
        message: `${opName} first argument must be a vector field (rank 1 contravariant)`,
        range: token.range,
        code: "chacana/operator",
      });
    }
  };
}

function secondArgNotZeroForm(
  token: ValidationToken,
  ctx: GlobalContext,
  diags: CheckerDiagnostic[],
): void {
  if (token.args.length < 2) return;
  const rank = resolveRank(token.args[1], ctx);
  if (rank != null && rank === 0) {
    diags.push({
      message: "Interior product is undefined for 0-forms (rank 0)",
      range: token.range,
      code: "chacana/operator",
    });
  }
}

function firstArgMinRank(minRank: number, opName: string): OperatorCheck {
  return (token, ctx, diags) => {
    if (token.args.length < 1) return;
    const rank = resolveRank(token.args[0], ctx);
    if (rank != null && rank < minRank) {
      diags.push({
        message: `${opName} requires a tensor of rank >= ${minRank}, but argument has rank ${rank}`,
        range: token.range,
        code: "chacana/operator",
      });
    }
  };
}

function firstArgExactRank(exactRank: number, opName: string): OperatorCheck {
  return (token, ctx, diags) => {
    if (token.args.length < 1) return;
    const rank = resolveRank(token.args[0], ctx);
    if (rank != null && rank !== exactRank) {
      diags.push({
        message: `${opName} requires a rank-${exactRank} tensor, but argument has rank ${rank}`,
        range: token.range,
        code: "chacana/operator",
      });
    }
  };
}

const OPERATOR_CONSTRAINTS: Record<string, OperatorCheck[]> = {
  [HEAD_HODGE_STAR]: [requiresMetric],
  [HEAD_INTERIOR_PRODUCT]: [firstArgIsVector("Interior product"), secondArgNotZeroForm],
  [HEAD_LIE_DERIVATIVE]: [firstArgIsVector("Lie derivative")],
  [HEAD_TRACE]: [firstArgMinRank(2, "Trace")],
  [HEAD_DETERMINANT]: [firstArgExactRank(2, "Determinant")],
  [HEAD_INVERSE]: [firstArgExactRank(2, "Inverse")],
};

function checkOperators(
  token: ValidationToken,
  ctx: GlobalContext,
  diags: CheckerDiagnostic[],
): void {
  for (const t of walkTokens(token)) {
    const constraints = OPERATOR_CONSTRAINTS[t.head];
    if (constraints) {
      for (const check of constraints) {
        check(t, ctx, diags);
      }
    }
  }
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
  checkFreeIndexInvariance(token, ctx, diags);
  checkSymmetry(token, ctx, diags);
  if (ctx) {
    checkRank(token, ctx, diags);
    checkOperators(token, ctx, diags);
  }
  return diags;
}
