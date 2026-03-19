/**
 * TOML Global Context (Γ) loader.
 * Ports src/chacana/context.py to TypeScript.
 * Browser-compatible: uses smol-toml (pure JS, no Node deps).
 */

import { parse as parseTOML } from "smol-toml";
import { Variance } from "./ast.js";

export interface ManifoldDecl {
  name: string;
  dimension: number;
  indexType: string;
}

export interface SymmetryDecl {
  indices: number[];
  type: "Symmetric" | "AntiSymmetric";
}

export interface TensorDecl {
  name: string;
  manifold: string;
  rank: number;
  indexPattern: Variance[];
  symmetries: SymmetryDecl[];
}

export interface GlobalContext {
  manifolds: Map<string, ManifoldDecl>;
  tensors: Map<string, TensorDecl>;
  activeMetric: string | null;
}

function parseVariance(s: string): Variance {
  if (s === "Contra" || s === "contra") return Variance.Contra;
  if (s === "Covar" || s === "covar") return Variance.Covar;
  throw new Error(`Unknown variance: '${s}'`);
}

export function loadContext(source: string): GlobalContext {
  const data = parseTOML(source) as Record<string, unknown>;

  const ctx: GlobalContext = {
    manifolds: new Map(),
    tensors: new Map(),
    activeMetric: null,
  };

  // Strategy
  const strategy = (data.strategy ?? {}) as Record<string, unknown>;
  ctx.activeMetric = (strategy.active_metric as string) ?? null;

  // Manifolds
  const manifolds = (data.manifold ?? {}) as Record<string, Record<string, unknown>>;
  for (const [name, mdata] of Object.entries(manifolds)) {
    if (mdata.dimension == null) {
      throw new Error(`Manifold '${name}' missing required 'dimension'`);
    }
    ctx.manifolds.set(name, {
      name,
      dimension: mdata.dimension as number,
      indexType: (mdata.index_type as string) ?? "Latin",
    });
  }

  // Tensors
  const tensors = (data.tensor ?? {}) as Record<string, Record<string, unknown>>;
  for (const [name, tdata] of Object.entries(tensors)) {
    const rawPattern = (tdata.index_pattern ?? []) as string[];
    const indexPattern = rawPattern.map(parseVariance);
    const rawSymmetries = (tdata.symmetries ?? []) as Array<{
      indices: number[];
      type: string;
    }>;
    const symmetries: SymmetryDecl[] = rawSymmetries.map((s) => ({
      indices: s.indices,
      type: s.type as "Symmetric" | "AntiSymmetric",
    }));
    ctx.tensors.set(name, {
      name,
      manifold: (tdata.manifold as string) ?? "",
      rank: (tdata.rank as number) ?? 0,
      indexPattern,
      symmetries,
    });
  }

  // Validation
  for (const [name, t] of ctx.tensors) {
    if (t.manifold && !ctx.manifolds.has(t.manifold)) {
      throw new Error(`Tensor '${name}' references unknown manifold '${t.manifold}'`);
    }
    if (t.indexPattern.length > 0 && t.indexPattern.length !== t.rank) {
      throw new Error(
        `Tensor '${name}' index_pattern length (${t.indexPattern.length}) != rank (${t.rank})`,
      );
    }
  }

  if (ctx.activeMetric != null && !ctx.tensors.has(ctx.activeMetric)) {
    throw new Error(`active_metric '${ctx.activeMetric}' references unknown tensor`);
  }

  return ctx;
}
