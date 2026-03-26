"""TOML Global Context (Γ) loader."""

from __future__ import annotations

import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

if sys.version_info >= (3, 11):
    import tomllib
else:
    import tomli as tomllib

from chacana.ast import Variance
from chacana.errors import ChacanaError

_VALID_INDEX_TYPES = {"Latin", "Greek", "Spinor"}


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
class SparsityDecl:
    name: str
    structural_zeros: list[list[int]] = field(default_factory=list)


@dataclass
class PerturbationDecl:
    name: str
    parameter: str
    order: int
    manifold: str


@dataclass
class GlobalContext:
    manifolds: dict[str, ManifoldDecl] = field(default_factory=dict)
    tensors: dict[str, TensorDecl] = field(default_factory=dict)
    active_metric: str | None = None
    strategy: dict[str, object] = field(default_factory=dict)
    sparsity: dict[str, SparsityDecl] = field(default_factory=dict)
    perturbations: dict[str, PerturbationDecl] = field(default_factory=dict)


def _parse_variance(s: str) -> Variance:
    if s in ("Contra", "contra"):
        return Variance.CONTRA
    if s in ("Covar", "covar"):
        return Variance.COVAR
    raise ChacanaError(f"Unknown variance: {s!r}")


def _validate_context(ctx: GlobalContext) -> None:
    """Run cross-referential validation on a fully parsed context."""
    # Validate manifold index_type values
    for name, m in ctx.manifolds.items():
        if m.index_type not in _VALID_INDEX_TYPES:
            raise ChacanaError(
                f"Invalid index_type {m.index_type!r} for manifold {name!r}; "
                f"must be one of {sorted(_VALID_INDEX_TYPES)}"
            )

    # Validate tensors
    for name, t in ctx.tensors.items():
        # Tensor must reference an existing manifold
        if t.manifold not in ctx.manifolds:
            raise ChacanaError(f"Tensor {name!r} references unknown manifold {t.manifold!r}")

        # index_pattern length must match rank (when pattern is provided)
        if t.index_pattern and len(t.index_pattern) != t.rank:
            raise ChacanaError(
                f"Tensor {name!r} index_pattern length ({len(t.index_pattern)}) != rank ({t.rank})"
            )

        # Symmetry indices must be in [1, rank]
        for sym in t.symmetries:
            for idx in sym.indices:
                if idx < 1 or idx > t.rank:
                    raise ChacanaError(
                        f"Tensor {name!r} symmetry index {idx} out of range [1, {t.rank}]"
                    )

    # Validate active_metric references an existing tensor
    if ctx.active_metric is not None and ctx.active_metric not in ctx.tensors:
        raise ChacanaError(f"active_metric {ctx.active_metric!r} references unknown tensor")

    # Validate perturbation manifold references
    for name, p in ctx.perturbations.items():
        if p.manifold not in ctx.manifolds:
            raise ChacanaError(f"perturbation {name!r} references unknown manifold {p.manifold!r}")


def _build_context(data: dict[str, Any]) -> GlobalContext:
    """Build a GlobalContext from parsed TOML data."""
    ctx = GlobalContext()

    # Load strategy (preserve all keys)
    strategy = data.get("strategy", {})
    ctx.strategy = dict(strategy)
    ctx.active_metric = strategy.get("active_metric")

    # Load manifolds
    for name, mdata in data.get("manifold", {}).items():
        if "dimension" not in mdata:
            raise ChacanaError(f"Manifold {name!r} missing required 'dimension'")
        ctx.manifolds[name] = ManifoldDecl(
            name=name,
            dimension=mdata["dimension"],
            index_type=mdata.get("index_type", "Latin"),
        )

    # Load tensors
    for name, tdata in data.get("tensor", {}).items():
        pattern = [_parse_variance(v) for v in tdata.get("index_pattern", [])]
        symmetries = []
        for sym in tdata.get("symmetries", []):
            symmetries.append(SymmetryDecl(indices=sym["indices"], type=sym["type"]))
        ctx.tensors[name] = TensorDecl(
            name=name,
            manifold=tdata.get("manifold", ""),
            rank=tdata.get("rank", 0),
            index_pattern=pattern,
            symmetries=symmetries,
        )

    # Load sparsity declarations
    for name, sdata in data.get("sparsity", {}).items():
        ctx.sparsity[name] = SparsityDecl(
            name=name,
            structural_zeros=sdata.get("structural_zeros", []),
        )

    # Load perturbation declarations
    for name, pdata in data.get("perturbation", {}).items():
        ctx.perturbations[name] = PerturbationDecl(
            name=name,
            parameter=pdata.get("parameter", ""),
            order=pdata.get("order", 1),
            manifold=pdata.get("manifold", ""),
        )

    # Run cross-referential validation after all sections are parsed
    _validate_context(ctx)

    return ctx


def load_context_file(path: str | Path) -> GlobalContext:
    """Load a GlobalContext from a TOML file."""
    try:
        with open(path, "rb") as f:
            data = tomllib.load(f)
    except FileNotFoundError as e:
        raise ChacanaError(f"Context file not found: {path}") from e
    return _build_context(data)


def load_context_string(toml_string: str) -> GlobalContext:
    """Load a GlobalContext from a TOML string."""
    return _build_context(tomllib.loads(toml_string))


def load_context(source: str | Path) -> GlobalContext:
    """Load a GlobalContext from a TOML file path or string.

    Prefer :func:`load_context_file` or :func:`load_context_string` for
    unambiguous loading.
    """
    import warnings

    if isinstance(source, Path):
        return load_context_file(source)
    if "\n" not in source and Path(source).is_file():
        warnings.warn(
            "load_context() auto-detected a file path from a string argument. "
            "Use load_context_file() instead for explicit file loading.",
            DeprecationWarning,
            stacklevel=2,
        )
        return load_context_file(source)
    return load_context_string(source)
