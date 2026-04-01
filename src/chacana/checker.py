"""Static type checker for Chacana AST.

Rules 1 (contraction), 2 (free index invariance), 3 (symmetry validity).
"""

from __future__ import annotations

from collections import Counter
from collections.abc import Callable

from chacana.ast import (
    HEAD_ADD,
    HEAD_DETERMINANT,
    HEAD_DIVIDE,
    HEAD_HODGE_STAR,
    HEAD_INTERIOR_PRODUCT,
    HEAD_INVERSE,
    HEAD_LIE_DERIVATIVE,
    HEAD_MULTIPLY,
    HEAD_NEGATE,
    HEAD_NUMBER,
    HEAD_RATIONAL,
    HEAD_TRACE,
    HEAD_WEDGE,
    ChacanaIndex,
    ValidationToken,
    Variance,
    walk_tokens,
)
from chacana.context import GlobalContext
from chacana.errors import ChacanaTypeError
from chacana.indices import IndexAnalyzer


def _check_contraction(token: ValidationToken, ctx: GlobalContext | None) -> None:
    """Rule 1: Contraction indices must have opposite variance and matching index_type."""
    analyzer = IndexAnalyzer(ctx)
    _check_contraction_with(token, ctx, analyzer)


def _check_contraction_with(
    token: ValidationToken, ctx: GlobalContext | None, analyzer: IndexAnalyzer
) -> None:
    if token.head in (HEAD_MULTIPLY, HEAD_WEDGE, HEAD_DIVIDE):
        all_indices: list[ChacanaIndex] = []
        for arg in token.args:
            _check_contraction_with(arg, ctx, analyzer)
            all_indices.extend(analyzer.all_indices(arg))

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
                # Variance check for Multiply/Divide (wedge doesn't contract).
                is_product = token.head in (HEAD_MULTIPLY, HEAD_DIVIDE)
                if is_product and group[0].variance == group[1].variance:
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
    else:
        for arg in token.args:
            _check_contraction_with(arg, ctx, analyzer)


def _check_free_index_invariance(token: ValidationToken, ctx: GlobalContext | None) -> None:
    """Rule 2: All terms in a sum must have the same free indices."""
    analyzer = IndexAnalyzer(ctx)
    for t in walk_tokens(token):
        if t.head != HEAD_ADD or len(t.args) < 2:
            continue
        ref = analyzer.free_indices(t.args[0])
        ref_counted = Counter((idx.label, idx.variance) for idx in ref)
        for i, arg in enumerate(t.args[1:], 1):
            arg_free = analyzer.free_indices(arg)
            arg_counted = Counter((idx.label, idx.variance) for idx in arg_free)
            if ref_counted != arg_counted:
                raise ChacanaTypeError(
                    f"Free index mismatch in sum: term 0 has "
                    f"{_format_indices(ref)}, term {i} has "
                    f"{_format_indices(arg_free)}"
                )


def _check_symmetry(token: ValidationToken, ctx: GlobalContext | None) -> None:
    """Rule 3: Symmetrized index groups must have matching variance and index_type.

    Checks two sources of symmetry information:
    1. Explicit symmetrization in the expression
       (metadata: symmetrized_groups / antisymmetrized_groups)
    2. Declared symmetries in the context (tensor.symmetries)
    """
    for t in walk_tokens(token):
        _check_symmetry_single(t, ctx)


def _validate_symmetry_group(
    indices: list[ChacanaIndex], positions: list[int], label: str
) -> None:
    """Check that indices at the given positions have matching variance and type."""
    if len(positions) < 2:
        return
    ref = indices[positions[0]]
    for pos in positions[1:]:
        other = indices[pos]
        if ref.variance != other.variance:
            raise ChacanaTypeError(
                f"Variance mismatch in {label}: index "
                f"'{ref.label}' ({ref.variance.value}) vs "
                f"'{other.label}' ({other.variance.value})"
            )
        if ref.index_type != other.index_type:
            raise ChacanaTypeError(
                f"Index type mismatch in {label}: index "
                f"'{ref.label}' ({ref.index_type.value}) vs "
                f"'{other.label}' ({other.index_type.value})"
            )


def _check_symmetry_single(token: ValidationToken, ctx: GlobalContext | None) -> None:
    for kind, groups in (
        ("symmetrization", token.metadata.symmetrized_groups),
        ("anti-symmetrization", token.metadata.antisymmetrized_groups),
    ):
        for group in groups:
            _validate_symmetry_group(token.indices, group, kind)

    if ctx is not None:
        decl = ctx.tensors.get(token.head)
        if decl is not None and token.indices:
            for sym in decl.symmetries:
                positions = [i - 1 for i in sym.indices]
                if all(0 <= p < len(token.indices) for p in positions):
                    _validate_symmetry_group(
                        token.indices,
                        positions,
                        f"declared symmetry of '{token.head}'",
                    )


_STRUCTURAL_HEADS = frozenset(
    {
        HEAD_ADD,
        HEAD_MULTIPLY,
        HEAD_WEDGE,
        HEAD_NEGATE,
        HEAD_NUMBER,
        HEAD_DIVIDE,
        HEAD_RATIONAL,
    }
)


def _check_rank(token: ValidationToken, ctx: GlobalContext) -> None:
    """Check that tensor usage matches declared rank and index pattern."""
    for t in walk_tokens(token):
        if t.head in _STRUCTURAL_HEADS:
            continue
        decl = ctx.tensors.get(t.head)
        if decl is None:
            continue
        # Derivative indices (;e, ,a) are not part of the tensor's intrinsic rank
        tensor_indices = [idx for idx in t.indices if not idx.is_derivative]
        if tensor_indices and len(tensor_indices) != decl.rank:
            diff = decl.rank - len(tensor_indices)
            if not (ctx.active_metric and diff > 0 and diff % 2 == 0):
                raise ChacanaTypeError(
                    f"Tensor '{t.head}' declared with rank {decl.rank}, "
                    f"but used with {len(tensor_indices)} indices"
                )
        if tensor_indices and decl.index_pattern and not ctx.active_metric:
            for i, (actual, expected) in enumerate(
                zip(tensor_indices, decl.index_pattern, strict=False)
            ):
                if actual.variance != expected:
                    raise ChacanaTypeError(
                        f"Tensor '{t.head}' index {i}: expected "
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


OperatorCheck = Callable[[ValidationToken, GlobalContext], None]


def _requires_metric(token: ValidationToken, ctx: GlobalContext) -> None:
    if not ctx.active_metric:
        raise ChacanaTypeError("Hodge star operator requires an active_metric in the context")


def _first_arg_is_vector(op_name: str) -> OperatorCheck:
    def check(token: ValidationToken, ctx: GlobalContext) -> None:
        if len(token.args) < 1:
            return
        if _is_vector(token.args[0], ctx) is False:
            raise ChacanaTypeError(
                f"{op_name} first argument must be a vector field (rank 1 contravariant)"
            )

    return check


def _second_arg_not_zero_form(token: ValidationToken, ctx: GlobalContext) -> None:
    if len(token.args) < 2:
        return
    rank = _resolve_rank(token.args[1], ctx)
    if rank is not None and rank == 0:
        raise ChacanaTypeError(
            "Interior product is undefined for 0-forms (rank 0); "
            "second argument must be a p-form with p >= 1"
        )


def _first_arg_min_rank(min_rank: int, op_name: str) -> OperatorCheck:
    def check(token: ValidationToken, ctx: GlobalContext) -> None:
        if len(token.args) < 1:
            return
        rank = _resolve_rank(token.args[0], ctx)
        if rank is not None and rank < min_rank:
            raise ChacanaTypeError(
                f"{op_name} requires a tensor of rank >= {min_rank}, but argument has rank {rank}"
            )

    return check


def _first_arg_exact_rank(exact_rank: int, op_name: str) -> OperatorCheck:
    def check(token: ValidationToken, ctx: GlobalContext) -> None:
        if len(token.args) < 1:
            return
        rank = _resolve_rank(token.args[0], ctx)
        if rank is not None and rank != exact_rank:
            raise ChacanaTypeError(
                f"{op_name} requires a rank-{exact_rank} tensor, but argument has rank {rank}"
            )

    return check


_OPERATOR_CONSTRAINTS: dict[str, list[OperatorCheck]] = {
    HEAD_HODGE_STAR: [_requires_metric],
    HEAD_INTERIOR_PRODUCT: [
        _first_arg_is_vector("Interior product"),
        _second_arg_not_zero_form,
    ],
    HEAD_LIE_DERIVATIVE: [_first_arg_is_vector("Lie derivative")],
    HEAD_TRACE: [_first_arg_min_rank(2, "Trace")],
    HEAD_DETERMINANT: [_first_arg_exact_rank(2, "Determinant")],
    HEAD_INVERSE: [_first_arg_exact_rank(2, "Inverse")],
}


def _check_operators(token: ValidationToken, ctx: GlobalContext) -> None:
    """Check differential geometry operator constraints."""
    for t in walk_tokens(token):
        for constraint in _OPERATOR_CONSTRAINTS.get(t.head, []):
            constraint(t, ctx)


def _format_indices(indices: list[ChacanaIndex]) -> str:
    parts = []
    for idx in indices:
        prefix = "^" if idx.variance == Variance.CONTRA else "_"
        parts.append(f"{prefix}{idx.label}")
    return "{" + " ".join(parts) + "}" if parts else "{}"


def check(token: ValidationToken, ctx: GlobalContext | None = None) -> ValidationToken:
    """Run all type checks on a ValidationToken. Returns the token if valid."""
    _check_contraction(token, ctx)
    _check_free_index_invariance(token, ctx)
    _check_symmetry(token, ctx)
    if ctx is not None:
        _check_rank(token, ctx)
        _check_operators(token, ctx)
    return token
