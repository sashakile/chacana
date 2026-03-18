"""TOML Global Context (Γ) loader."""

from __future__ import annotations

import sys
from dataclasses import dataclass, field
from pathlib import Path

if sys.version_info >= (3, 11):
    import tomllib
else:
    import tomli as tomllib

from chacana.ast import Variance
from chacana.errors import ChacanaError


@dataclass
class ManifoldDecl:
    name: str
    dimension: int
    index_type: str = "Latin"


@dataclass
class SymmetryDecl:
    indices: list[int]  # 1-based indices
    type: str  # "Symmetric" or "AntiSymmetric"


@dataclass
class TensorDecl:
    name: str
    manifold: str
    rank: int
    index_pattern: list[Variance] = field(default_factory=list)
    symmetries: list[SymmetryDecl] = field(default_factory=list)


@dataclass
class GlobalContext:
    manifolds: dict[str, ManifoldDecl] = field(default_factory=dict)
    tensors: dict[str, TensorDecl] = field(default_factory=dict)
    active_metric: str | None = None


def _parse_variance(s: str) -> Variance:
    if s in ("Contra", "contra"):
        return Variance.CONTRA
    if s in ("Covar", "covar"):
        return Variance.COVAR
    raise ChacanaError(f"Unknown variance: {s!r}")


def load_context(source: str | Path) -> GlobalContext:
    """Load a GlobalContext from a TOML file path or string."""
    if isinstance(source, Path):
        with open(source, "rb") as f:
            data = tomllib.load(f)
    elif "\n" not in source and Path(source).is_file():
        with open(source, "rb") as f:
            data = tomllib.load(f)
    else:
        data = tomllib.loads(source)

    ctx = GlobalContext()

    # Load strategy
    strategy = data.get("strategy", {})
    ctx.active_metric = strategy.get("active_metric")

    for name, mdata in data.get("manifold", {}).items():
        if "dimension" not in mdata:
            raise ChacanaError(f"Manifold {name!r} missing required 'dimension'")
        ctx.manifolds[name] = ManifoldDecl(
            name=name,
            dimension=mdata["dimension"],
            index_type=mdata.get("index_type", "Latin"),
        )

    for name, tdata in data.get("tensor", {}).items():
        pattern = [_parse_variance(v) for v in tdata.get("index_pattern", [])]
        symmetries = []
        for sym in tdata.get("symmetries", []):
            symmetries.append(
                SymmetryDecl(indices=sym["indices"], type=sym["type"])
            )
        ctx.tensors[name] = TensorDecl(
            name=name,
            manifold=tdata.get("manifold", ""),
            rank=tdata.get("rank", 0),
            index_pattern=pattern,
            symmetries=symmetries,
        )

    return ctx
