"""Unified index traversal and analysis for Chacana AST.

Centralizes free_indices, all_indices, contracted_pairs, and remove_contracted
into a single IndexAnalyzer class that is optionally metric-aware.
"""

from __future__ import annotations

from collections import Counter

from chacana.ast import (
    HEAD_ADD,
    HEAD_EXTERIOR_DERIVATIVE,
    HEAD_MULTIPLY,
    HEAD_NEGATE,
    HEAD_NUMBER,
    HEAD_WEDGE,
    ChacanaIndex,
    ValidationToken,
)
from chacana.context import GlobalContext


class IndexAnalyzer:
    """Unified index traversal, optionally metric-aware.

    When constructed with a GlobalContext that has ``active_metric`` set,
    same-variance index pairs are treated as contracted (the metric can
    raise/lower indices).
    """

    __slots__ = ("_metric_aware",)

    def __init__(self, ctx: GlobalContext | None = None) -> None:
        self._metric_aware: bool = bool(ctx and ctx.active_metric)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def free_indices(self, token: ValidationToken) -> list[ChacanaIndex]:
        """Return the free (uncontracted) indices of *token*."""
        if token.head == HEAD_ADD:
            return self.free_indices(token.args[0]) if token.args else []

        if token.head == HEAD_NEGATE:
            return self.free_indices(token.args[0]) if token.args else []

        if token.head == HEAD_MULTIPLY:
            all_idx: list[ChacanaIndex] = []
            for arg in token.args:
                all_idx.extend(self.free_indices(arg))
            return self.remove_contracted(all_idx)

        if token.head == HEAD_WEDGE:
            all_idx = []
            for arg in token.args:
                all_idx.extend(self.free_indices(arg))
            return all_idx  # wedge products don't contract

        if token.head == HEAD_EXTERIOR_DERIVATIVE:
            return self.free_indices(token.args[0]) if token.args else []

        if token.head == HEAD_NUMBER:
            return []

        # Leaf tensor or expression with indices.
        return list(token.indices)

    def all_indices(self, token: ValidationToken) -> list[ChacanaIndex]:
        """Return all indices without cancelling contractions.

        For Add nodes, returns the max-multiplicity union across all terms
        so that contraction checking can detect issues in any term.
        """
        if token.head == HEAD_ADD:
            if not token.args:
                return []
            max_counts: Counter[ChacanaIndex] = Counter()
            for arg in token.args:
                arg_counts = Counter(self.all_indices(arg))
                for idx, count in arg_counts.items():
                    if count > max_counts[idx]:
                        max_counts[idx] = count
            return list(max_counts.elements())

        if token.head == HEAD_NEGATE:
            return self.all_indices(token.args[0]) if token.args else []

        if token.head in (HEAD_MULTIPLY, HEAD_WEDGE):
            result: list[ChacanaIndex] = []
            for arg in token.args:
                result.extend(self.all_indices(arg))
            return result

        if token.head == HEAD_NUMBER:
            return []

        return list(token.indices)

    def contracted_pairs(self, token: ValidationToken) -> list[tuple[ChacanaIndex, ChacanaIndex]]:
        """Return explicitly contracted index pairs found in *token*."""
        if token.head == HEAD_MULTIPLY:
            all_idx: list[ChacanaIndex] = []
            for arg in token.args:
                all_idx.extend(self.free_indices(arg))
            return self._find_pairs(all_idx)

        result: list[tuple[ChacanaIndex, ChacanaIndex]] = []
        for arg in token.args:
            result.extend(self.contracted_pairs(arg))
        return result

    def remove_contracted(self, indices: list[ChacanaIndex]) -> list[ChacanaIndex]:
        """Remove contracted pairs from a flat index list.

        Contraction requires same label, same index_type, and either
        opposite variance (always) or same variance (when metric-aware).
        """
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
                    and (idx.variance != other.variance or self._metric_aware)
                ):
                    consumed.add(i)
                    consumed.add(j)
                    found_pair = True
                    break
            if not found_pair:
                free.append(idx)
        return free

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _find_pairs(self, indices: list[ChacanaIndex]) -> list[tuple[ChacanaIndex, ChacanaIndex]]:
        """Find contraction pairs in a flat index list."""
        pairs: list[tuple[ChacanaIndex, ChacanaIndex]] = []
        consumed: set[int] = set()
        for i, idx in enumerate(indices):
            if i in consumed:
                continue
            for j, other in enumerate(indices):
                if j <= i or j in consumed:
                    continue
                if (
                    idx.label == other.label
                    and idx.index_type == other.index_type
                    and (idx.variance != other.variance or self._metric_aware)
                ):
                    consumed.add(i)
                    consumed.add(j)
                    pairs.append((idx, other))
                    break
        return pairs
