"""Static type checker for Chacana AST — Rules 1 (contraction) and 2 (free index invariance)."""

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
    """Remove contracted pairs (same name, opposite variance)."""
    free: list[ChacanaIndex] = []
    consumed: set[int] = set()
    for i, idx in enumerate(indices):
        if i in consumed:
            continue
        found_pair = False
        for j, other in enumerate(indices):
            if j <= i or j in consumed:
                continue
            if idx.label == other.label and idx.variance != other.variance:
                consumed.add(i)
                consumed.add(j)
                found_pair = True
                break
        if not found_pair:
            free.append(idx)
    return free


def _check_contraction(token: ValidationToken, ctx: GlobalContext | None) -> None:
    """Rule 1: Contraction indices must have opposite variance."""
    if token.head in ("Multiply", "Wedge"):
        all_indices: list[ChacanaIndex] = []
        for arg in token.args:
            _check_contraction(arg, ctx)
            all_indices.extend(_get_all_indices(arg))
        
        if token.head == "Multiply":
            # Check that repeated index names have opposite variance
            by_name: dict[str, list[ChacanaIndex]] = {}
            for idx in all_indices:
                by_name.setdefault(idx.label, []).append(idx)
            for name, group in by_name.items():
                if len(group) == 2:
                    if group[0].variance == group[1].variance:
                        # Metric-aware contraction: if active_metric is present, allow it
                        if ctx and ctx.active_metric:
                            continue
                        raise ChacanaTypeError(
                            f"Contraction index '{name}' appears twice with same "
                            f"variance ({group[0].variance.value})"
                        )
                elif len(group) > 2:
                    raise ChacanaTypeError(
                        f"Index '{name}' appears {len(group)} times (expected at most 2)"
                    )
    elif token.head == "Add":
        for arg in token.args:
            _check_contraction(arg, ctx)
    elif token.args:
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


def _check_rank(token: ValidationToken, ctx: GlobalContext) -> None:
    """Check that tensor usage matches declared rank and index pattern."""
    if token.head in ("Add", "Multiply", "Wedge"):
        for arg in token.args:
            _check_rank(arg, ctx)
        return

    if token.head == "Number":
        return

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
            zip(token.indices, decl.index_pattern)
        ):
            if actual.variance != expected:
                raise ChacanaTypeError(
                    f"Tensor '{token.head}' index {i}: expected "
                    f"{expected.value}, got {actual.variance.value}"
                )


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
    if ctx is not None:
        _check_rank(token, ctx)
    return token
