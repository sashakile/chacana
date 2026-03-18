"""Static type checker for Chacana AST.

Rules 1 (contraction), 2 (free index invariance), 3 (symmetry validity).
"""

from __future__ import annotations

from collections import Counter

from chacana.ast import (
    HEAD_ADD,
    HEAD_DETERMINANT,
    HEAD_EXTERIOR_DERIVATIVE,
    HEAD_HODGE_STAR,
    HEAD_INTERIOR_PRODUCT,
    HEAD_INVERSE,
    HEAD_LIE_DERIVATIVE,
    HEAD_MULTIPLY,
    HEAD_NEGATE,
    HEAD_NUMBER,
    HEAD_TRACE,
    HEAD_WEDGE,
    ChacanaIndex,
    ValidationToken,
    Variance,
)
from chacana.context import GlobalContext
from chacana.errors import ChacanaTypeError


def _free_indices(token: ValidationToken) -> list[ChacanaIndex]:
    """Return the free (uncontracted) indices of a token."""
    if token.head == HEAD_ADD:
        if token.args:
            return _free_indices(token.args[0])
        return []

    if token.head == HEAD_NEGATE:
        if token.args:
            return _free_indices(token.args[0])
        return []

    if token.head == HEAD_MULTIPLY:
        all_indices: list[ChacanaIndex] = []
        for arg in token.args:
            all_indices.extend(_free_indices(arg))
        return _remove_contracted(all_indices)

    if token.head == HEAD_WEDGE:
        all_indices = []
        for arg in token.args:
            all_indices.extend(_free_indices(arg))
        return all_indices  # Wedge products don't contract

    if token.head == HEAD_EXTERIOR_DERIVATIVE:
        if token.args:
            return _free_indices(token.args[0])
        return []

    if token.head == HEAD_NUMBER:
        return []

    # Leaf tensor or expression with indices
    return list(token.indices)


def _remove_contracted(indices: list[ChacanaIndex]) -> list[ChacanaIndex]:
    """Remove contracted pairs (same label, same index_type, opposite variance)."""
    free: list[ChacanaIndex] = []
    consumed: set[int] = set()
    for i, idx in enumerate(indices):
        if i in consumed:
            continue
        found_pair = False
        for j, other in enumerate(indices):
            if j <= i or j in consumed:
                continue
            if (
                idx.label == other.label
                and idx.index_type == other.index_type
                and idx.variance != other.variance
            ):
                consumed.add(i)
                consumed.add(j)
                found_pair = True
                break
        if not found_pair:
            free.append(idx)
    return free


def _check_contraction(token: ValidationToken, ctx: GlobalContext | None) -> None:
    """Rule 1: Contraction indices must have opposite variance and matching index_type."""
    if token.head in (HEAD_MULTIPLY, HEAD_WEDGE):
        all_indices: list[ChacanaIndex] = []
        for arg in token.args:
            _check_contraction(arg, ctx)
            all_indices.extend(_get_all_indices(arg))

        if token.head == HEAD_MULTIPLY:
            by_label: dict[str, list[ChacanaIndex]] = {}
            for idx in all_indices:
                by_label.setdefault(idx.label, []).append(idx)
            for label, group in by_label.items():
                if len(group) == 2:
                    if group[0].index_type != group[1].index_type:
                        raise ChacanaTypeError(
                            f"Contraction index '{label}' has mismatched index type: "
                            f"{group[0].index_type.value} vs {group[1].index_type.value}"
                        )
                    if group[0].variance == group[1].variance:
                        if ctx and ctx.active_metric:
                            continue
                        raise ChacanaTypeError(
                            f"Contraction index '{label}' appears twice with same "
                            f"variance ({group[0].variance.value})"
                        )
                elif len(group) > 2:
                    raise ChacanaTypeError(
                        f"Index '{label}' appears {len(group)} times (expected at most 2)"
                    )
    elif token.head == HEAD_ADD or token.args:
        for arg in token.args:
            _check_contraction(arg, ctx)


def _get_all_indices(token: ValidationToken) -> list[ChacanaIndex]:
    """Get all indices from a token (without cancelling contractions)."""
    if token.head == HEAD_ADD:
        if token.args:
            return _get_all_indices(token.args[0])
        return []
    if token.head == HEAD_NEGATE:
        if token.args:
            return _get_all_indices(token.args[0])
        return []
    if token.head in (HEAD_MULTIPLY, HEAD_WEDGE):
        result: list[ChacanaIndex] = []
        for arg in token.args:
            result.extend(_get_all_indices(arg))
        return result
    if token.head == HEAD_NUMBER:
        return []
    return list(token.indices)


def _check_free_index_invariance(token: ValidationToken) -> None:
    """Rule 2: All terms in a sum must have the same free indices."""
    if token.head == HEAD_ADD:
        if len(token.args) < 2:
            return
        ref = _free_indices(token.args[0])
        ref_counted = Counter((idx.label, idx.variance) for idx in ref)
        for i, arg in enumerate(token.args[1:], 1):
            arg_free = _free_indices(arg)
            arg_counted = Counter((idx.label, idx.variance) for idx in arg_free)
            if ref_counted != arg_counted:
                raise ChacanaTypeError(
                    f"Free index mismatch in sum: term 0 has "
                    f"{_format_indices(ref)}, term {i} has "
                    f"{_format_indices(arg_free)}"
                )
    # Recurse into children
    for arg in token.args:
        _check_free_index_invariance(arg)


def _check_symmetry(token: ValidationToken, ctx: GlobalContext | None) -> None:
    """Rule 3: Symmetrized index groups must have matching variance and index_type.

    Checks two sources of symmetry information:
    1. Explicit symmetrization in the expression
       (metadata: symmetrized_groups / antisymmetrized_groups)
    2. Declared symmetries in the context (tensor.symmetries)
    """
    for group_key in ("symmetrized_groups", "antisymmetrized_groups"):
        groups = token.metadata.get(group_key, [])
        kind = "symmetrization" if "anti" not in group_key else "anti-symmetrization"
        for group in groups:
            if len(group) < 2:
                continue
            ref_idx = token.indices[group[0]]
            for pos in group[1:]:
                other_idx = token.indices[pos]
                if ref_idx.variance != other_idx.variance:
                    raise ChacanaTypeError(
                        f"Variance mismatch in {kind}: index "
                        f"'{ref_idx.label}' ({ref_idx.variance.value}) vs "
                        f"'{other_idx.label}' ({other_idx.variance.value})"
                    )
                if ref_idx.index_type != other_idx.index_type:
                    raise ChacanaTypeError(
                        f"Index type mismatch in {kind}: index "
                        f"'{ref_idx.label}' ({ref_idx.index_type.value}) vs "
                        f"'{other_idx.label}' ({other_idx.index_type.value})"
                    )

    if ctx is not None:
        decl = ctx.tensors.get(token.head)
        if decl is not None and token.indices:
            for sym in decl.symmetries:
                positions = [i - 1 for i in sym.indices]
                if all(0 <= p < len(token.indices) for p in positions):
                    ref_idx = token.indices[positions[0]]
                    for pos in positions[1:]:
                        other_idx = token.indices[pos]
                        if ref_idx.variance != other_idx.variance:
                            raise ChacanaTypeError(
                                f"Variance mismatch in declared symmetry of "
                                f"'{token.head}': slot {positions[0] + 1} "
                                f"({ref_idx.variance.value}) vs slot {pos + 1} "
                                f"({other_idx.variance.value})"
                            )
                        if ref_idx.index_type != other_idx.index_type:
                            raise ChacanaTypeError(
                                f"Index type mismatch in declared symmetry of "
                                f"'{token.head}': slot {positions[0] + 1} "
                                f"({ref_idx.index_type.value}) vs slot {pos + 1} "
                                f"({other_idx.index_type.value})"
                            )

    for arg in token.args:
        _check_symmetry(arg, ctx)


def _check_rank(token: ValidationToken, ctx: GlobalContext) -> None:
    """Check that tensor usage matches declared rank and index pattern."""
    if token.head in (HEAD_ADD, HEAD_MULTIPLY, HEAD_WEDGE):
        for arg in token.args:
            _check_rank(arg, ctx)
        return

    if token.head == HEAD_NUMBER:
        return

    # Recurse into functional ops, perturbation, commutator, negate, etc.
    if token.args:
        for arg in token.args:
            _check_rank(arg, ctx)

    decl = ctx.tensors.get(token.head)
    if decl is None:
        return

    if token.indices and len(token.indices) != decl.rank:
        raise ChacanaTypeError(
            f"Tensor '{token.head}' declared with rank {decl.rank}, "
            f"but used with {len(token.indices)} indices"
        )

    if token.indices and decl.index_pattern:
        for i, (actual, expected) in enumerate(
            zip(token.indices, decl.index_pattern, strict=False)
        ):
            if actual.variance != expected:
                raise ChacanaTypeError(
                    f"Tensor '{token.head}' index {i}: expected "
                    f"{expected.value}, got {actual.variance.value}"
                )


def _resolve_rank(token: ValidationToken, ctx: GlobalContext) -> int | None:
    """Resolve the rank of a token from its indices or context declaration."""
    if token.indices:
        return len(token.indices)
    decl = ctx.tensors.get(token.head)
    if decl is not None:
        return decl.rank
    return None


def _resolve_index_pattern(token: ValidationToken, ctx: GlobalContext) -> list[Variance] | None:
    """Resolve the index pattern (variance list) for a token."""
    if token.indices:
        return [idx.variance for idx in token.indices]
    decl = ctx.tensors.get(token.head)
    if decl is not None and decl.index_pattern:
        return list(decl.index_pattern)
    return None


def _is_vector(token: ValidationToken, ctx: GlobalContext) -> bool | None:
    """Check if a token represents a vector field (rank 1, contravariant).

    Returns True/False if determinable, None if unknown.
    """
    rank = _resolve_rank(token, ctx)
    if rank is None:
        return None
    if rank != 1:
        return False
    pattern = _resolve_index_pattern(token, ctx)
    if pattern is None:
        return None
    return pattern[0] == Variance.CONTRA


def _check_operators(token: ValidationToken, ctx: GlobalContext) -> None:
    """Check differential geometry operator constraints."""
    if token.head == HEAD_HODGE_STAR and not ctx.active_metric:
        raise ChacanaTypeError("Hodge star operator requires an active_metric in the context")

    if token.head == HEAD_INTERIOR_PRODUCT and len(token.args) >= 2:
        vec_check = _is_vector(token.args[0], ctx)
        if vec_check is False:
            raise ChacanaTypeError(
                "Interior product first argument must be a vector field (rank 1 contravariant)"
            )
        second_rank = _resolve_rank(token.args[1], ctx)
        if second_rank is not None and second_rank == 0:
            raise ChacanaTypeError(
                "Interior product is undefined for 0-forms (rank 0); "
                "second argument must be a p-form with p >= 1"
            )

    if token.head == HEAD_LIE_DERIVATIVE and len(token.args) >= 1:
        vec_check = _is_vector(token.args[0], ctx)
        if vec_check is False:
            raise ChacanaTypeError(
                "Lie derivative first argument must be a vector field (rank 1 contravariant)"
            )

    if token.head == HEAD_TRACE and len(token.args) >= 1:
        rank = _resolve_rank(token.args[0], ctx)
        if rank is not None and rank < 2:
            raise ChacanaTypeError(
                f"Trace requires a tensor of rank >= 2, but argument has rank {rank}"
            )

    if token.head == HEAD_DETERMINANT and len(token.args) >= 1:
        rank = _resolve_rank(token.args[0], ctx)
        if rank is not None and rank != 2:
            raise ChacanaTypeError(
                f"Determinant requires a rank-2 tensor, but argument has rank {rank}"
            )

    if token.head == HEAD_INVERSE and len(token.args) >= 1:
        rank = _resolve_rank(token.args[0], ctx)
        if rank is not None and rank != 2:
            raise ChacanaTypeError(
                f"Inverse requires a rank-2 tensor, but argument has rank {rank}"
            )

    for arg in token.args:
        _check_operators(arg, ctx)


def _format_indices(indices: list[ChacanaIndex]) -> str:
    parts = []
    for idx in indices:
        prefix = "^" if idx.variance == Variance.CONTRA else "_"
        parts.append(f"{prefix}{idx.label}")
    return "{" + " ".join(parts) + "}" if parts else "{}"


def check(token: ValidationToken, ctx: GlobalContext | None = None) -> ValidationToken:
    """Run all type checks on a ValidationToken. Returns the token if valid."""
    _check_contraction(token, ctx)
    _check_free_index_invariance(token)
    _check_symmetry(token, ctx)
    if ctx is not None:
        _check_rank(token, ctx)
        _check_operators(token, ctx)
    return token
