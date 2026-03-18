"""Static type checker for Chacana AST.

Rules 1 (contraction), 2 (free index invariance), 3 (symmetry validity).
"""

from __future__ import annotations

from chacana.ast import ChacanaIndex, ValidationToken, Variance
from chacana.context import GlobalContext
from chacana.errors import ChacanaTypeError


def _free_indices(token: ValidationToken) -> list[ChacanaIndex]:
    """Return the free (uncontracted) indices of a token."""
    if token.head == "Add":
        if token.args:
            return _free_indices(token.args[0])
        return []

    if token.head == "Multiply":
        all_indices: list[ChacanaIndex] = []
        for arg in token.args:
            all_indices.extend(_free_indices(arg))
        return _remove_contracted(all_indices)

    if token.head == "Wedge":
        all_indices = []
        for arg in token.args:
            all_indices.extend(_free_indices(arg))
        return all_indices  # Wedge products don't contract

    if token.head == "ExteriorDerivative":
        # d(p-form) -> (p+1)-form. We add a dummy index for rank tracking
        # but for free index matching, we need to be careful.
        # In Chacana, d(omega) doesn't have explicit indices in micro-syntax
        # unless it's (d omega){_a _b}.
        return _free_indices(token.args[0])

    if token.head == "Number":
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
    if token.head in ("Multiply", "Wedge"):
        all_indices: list[ChacanaIndex] = []
        for arg in token.args:
            _check_contraction(arg, ctx)
            all_indices.extend(_get_all_indices(arg))

        if token.head == "Multiply":
            # Check that repeated index labels have valid contraction pairing.
            # Group by label first, then validate within each group.
            by_label: dict[str, list[ChacanaIndex]] = {}
            for idx in all_indices:
                by_label.setdefault(idx.label, []).append(idx)
            for label, group in by_label.items():
                if len(group) == 2:
                    # Check index_type match first (takes priority)
                    if group[0].index_type != group[1].index_type:
                        raise ChacanaTypeError(
                            f"Contraction index '{label}' has mismatched index type: "
                            f"{group[0].index_type.value} vs {group[1].index_type.value}"
                        )
                    # Check variance opposition
                    if group[0].variance == group[1].variance:
                        # Metric-aware contraction: if active_metric is present, allow it
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
    elif token.head == "Add" or token.args:
        for arg in token.args:
            _check_contraction(arg, ctx)


def _get_all_indices(token: ValidationToken) -> list[ChacanaIndex]:
    """Get all indices from a token (without cancelling contractions)."""
    if token.head in ("Add",):
        if token.args:
            return _get_all_indices(token.args[0])
        return []
    if token.head in ("Multiply", "Wedge"):
        result: list[ChacanaIndex] = []
        for arg in token.args:
            result.extend(_get_all_indices(arg))
        return result
    if token.head == "Number":
        return []
    return list(token.indices)


def _check_free_index_invariance(token: ValidationToken) -> None:
    """Rule 2: All terms in a sum must have the same free indices."""
    if token.head == "Add":
        if len(token.args) < 2:
            return
        ref = _free_indices(token.args[0])
        ref_set = {(idx.label, idx.variance) for idx in ref}
        for i, arg in enumerate(token.args[1:], 1):
            arg_free = _free_indices(arg)
            arg_set = {(idx.label, idx.variance) for idx in arg_free}
            if ref_set != arg_set:
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
    # Check explicit symmetrization groups from expression metadata
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

    # Check declared symmetries from context
    if ctx is not None:
        decl = ctx.tensors.get(token.head)
        if decl is not None and token.indices:
            for sym in decl.symmetries:
                # sym.indices are 1-based slot positions
                positions = [i - 1 for i in sym.indices]
                # Only check if all positions are within bounds
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

    # Recurse into children
    for arg in token.args:
        _check_symmetry(arg, ctx)


def _check_rank(token: ValidationToken, ctx: GlobalContext) -> None:
    """Check that tensor usage matches declared rank and index pattern."""
    if token.head in ("Add", "Multiply", "Wedge"):
        for arg in token.args:
            _check_rank(arg, ctx)
        return

    if token.head == "Number":
        return

    # Recurse into functional ops, perturbation, commutator, etc.
    if token.args:
        for arg in token.args:
            _check_rank(arg, ctx)

    # Leaf tensor
    decl = ctx.tensors.get(token.head)
    if decl is None:
        return  # Unknown tensor, skip rank check

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
    """Resolve the rank of a token from its indices or context declaration.

    Returns None if the rank cannot be determined.
    """
    # If the token has explicit indices, rank = len(indices)
    if token.indices:
        return len(token.indices)
    # If it's a bare identifier, look up declared rank
    decl = ctx.tensors.get(token.head)
    if decl is not None:
        return decl.rank
    return None


def _resolve_index_pattern(token: ValidationToken, ctx: GlobalContext) -> list[Variance] | None:
    """Resolve the index pattern (variance list) for a token.

    Returns None if the pattern cannot be determined.
    """
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
        # rank 1 but no pattern info — assume it could be a vector
        return None
    return pattern[0] == Variance.CONTRA


def _check_operators(token: ValidationToken, ctx: GlobalContext) -> None:
    """Check differential geometry operator constraints.

    Validates:
    - HodgeStar: requires active_metric in context
    - InteriorProduct: first arg must be vector, second must be p-form (p >= 1)
    - LieDerivative: first arg must be a vector field
    - Trace: argument must have rank >= 2 (needs indices to contract)
    - Determinant: argument must be rank 2
    - Inverse: argument must be rank 2
    """
    # --- HodgeStar ---
    if token.head == "HodgeStar" and not ctx.active_metric:
        raise ChacanaTypeError("Hodge star operator requires an active_metric in the context")

    # --- InteriorProduct ---
    if token.head == "InteriorProduct" and len(token.args) >= 2:
        first_arg = token.args[0]
        second_arg = token.args[1]

        # First arg must be a vector (rank 1 contravariant)
        vec_check = _is_vector(first_arg, ctx)
        if vec_check is False:
            raise ChacanaTypeError(
                "Interior product first argument must be a vector field (rank 1 contravariant)"
            )

        # Second arg must be a p-form with p >= 1
        second_rank = _resolve_rank(second_arg, ctx)
        if second_rank is not None and second_rank == 0:
            raise ChacanaTypeError(
                "Interior product is undefined for 0-forms (rank 0); "
                "second argument must be a p-form with p >= 1"
            )

    # --- LieDerivative ---
    if token.head == "LieDerivative" and len(token.args) >= 1:
        first_arg = token.args[0]
        vec_check = _is_vector(first_arg, ctx)
        if vec_check is False:
            raise ChacanaTypeError(
                "Lie derivative first argument must be a vector field (rank 1 contravariant)"
            )

    # --- Trace ---
    if token.head == "Trace" and len(token.args) >= 1:
        arg = token.args[0]
        rank = _resolve_rank(arg, ctx)
        if rank is not None and rank < 2:
            raise ChacanaTypeError(
                f"Trace requires a tensor of rank >= 2, but argument has rank {rank}"
            )

    # --- Determinant ---
    if token.head == "Determinant" and len(token.args) >= 1:
        arg = token.args[0]
        rank = _resolve_rank(arg, ctx)
        if rank is not None and rank != 2:
            raise ChacanaTypeError(
                f"Determinant requires a rank-2 tensor, but argument has rank {rank}"
            )

    # --- Inverse ---
    if token.head == "Inverse" and len(token.args) >= 1:
        arg = token.args[0]
        rank = _resolve_rank(arg, ctx)
        if rank is not None and rank != 2:
            raise ChacanaTypeError(
                f"Inverse requires a rank-2 tensor, but argument has rank {rank}"
            )

    # Recurse into children
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
