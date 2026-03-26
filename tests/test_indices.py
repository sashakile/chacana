"""Tests for IndexAnalyzer — unified index traversal and analysis."""

import pytest

from chacana.ast import ChacanaIndex, IndexType, ValidationToken, Variance
from chacana.checker import check
from chacana.errors import ChacanaTypeError
from chacana.indices import IndexAnalyzer

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _ci(label: str, var: Variance, it: IndexType = IndexType.LATIN) -> ChacanaIndex:
    return ChacanaIndex(label, var, index_type=it)


def _leaf(name: str, *indices: ChacanaIndex) -> ValidationToken:
    return ValidationToken(head=name, indices=list(indices))


def _mul(*args: ValidationToken) -> ValidationToken:
    return ValidationToken(head="Multiply", args=list(args))


def _add(*args: ValidationToken) -> ValidationToken:
    return ValidationToken(head="Add", args=list(args))


def _wedge(*args: ValidationToken) -> ValidationToken:
    return ValidationToken(head="Wedge", args=list(args))


def _neg(arg: ValidationToken) -> ValidationToken:
    return ValidationToken(head="Negate", args=[arg])


def _num(val: float = 0.0) -> ValidationToken:
    return ValidationToken(head="Number", value=val)


UP = Variance.CONTRA
DN = Variance.COVAR


# ===========================================================================
# IndexAnalyzer.free_indices
# ===========================================================================


class TestFreeIndices:
    def test_leaf_returns_indices(self):
        analyzer = IndexAnalyzer()
        token = _leaf("T", _ci("a", UP), _ci("b", DN))
        assert analyzer.free_indices(token) == [_ci("a", UP), _ci("b", DN)]

    def test_multiply_removes_contracted(self):
        analyzer = IndexAnalyzer()
        token = _mul(_leaf("A", _ci("a", DN)), _leaf("B", _ci("a", UP)))
        free = analyzer.free_indices(token)
        assert free == []

    def test_multiply_keeps_uncontracted(self):
        analyzer = IndexAnalyzer()
        token = _mul(
            _leaf("A", _ci("a", DN)),
            _leaf("B", _ci("b", UP)),
        )
        free = analyzer.free_indices(token)
        assert len(free) == 2

    def test_add_returns_first_arg_free(self):
        analyzer = IndexAnalyzer()
        token = _add(
            _leaf("A", _ci("a", UP)),
            _leaf("B", _ci("a", UP)),
        )
        assert analyzer.free_indices(token) == [_ci("a", UP)]

    def test_wedge_no_contraction(self):
        analyzer = IndexAnalyzer()
        token = _wedge(
            _leaf("A", _ci("a", DN)),
            _leaf("B", _ci("a", UP)),
        )
        free = analyzer.free_indices(token)
        assert len(free) == 2  # wedge doesn't contract

    def test_negate_delegates(self):
        analyzer = IndexAnalyzer()
        token = _neg(_leaf("A", _ci("a", UP)))
        assert analyzer.free_indices(token) == [_ci("a", UP)]

    def test_number_empty(self):
        analyzer = IndexAnalyzer()
        assert analyzer.free_indices(_num()) == []

    # --- Bug fix: chacana-6si (metric-aware contraction) ---

    def test_metric_aware_removes_same_variance(self, metric_context):
        """With active_metric, same-variance pairs ARE contracted."""
        analyzer = IndexAnalyzer(metric_context)
        token = _mul(_leaf("A", _ci("a", DN)), _leaf("B", _ci("a", DN)))
        free = analyzer.free_indices(token)
        assert free == [], "Same-variance pair should be contracted with active metric"

    def test_no_metric_keeps_same_variance(self):
        """Without metric, same-variance pairs are NOT contracted."""
        analyzer = IndexAnalyzer()
        token = _mul(_leaf("A", _ci("a", DN)), _leaf("B", _ci("a", DN)))
        free = analyzer.free_indices(token)
        assert len(free) == 2, "Same-variance pair should NOT be contracted without metric"

    # --- chacana-x55: functional ops use own indices, not children's ---

    def test_functional_op_uses_own_indices(self):
        """Functional ops like Trace return their own indices, not args'."""
        analyzer = IndexAnalyzer()
        inner = _leaf("T", _ci("a", UP), _ci("b", DN))
        token = ValidationToken(head="Trace", args=[inner])
        # Trace has no indices of its own → empty
        assert analyzer.free_indices(token) == []

    def test_functional_op_with_attached_indices(self):
        """d(omega){_a _b} returns the attached indices."""
        analyzer = IndexAnalyzer()
        inner = _leaf("omega", _ci("c", DN))
        token = ValidationToken(
            head="ExteriorDerivative",
            args=[inner],
            indices=[_ci("a", DN), _ci("b", DN)],
        )
        # ExteriorDerivative delegates to arg, but here we have indices on the op
        # The fallthrough case returns token.indices
        free = analyzer.free_indices(token)
        # ExteriorDerivative with args delegates to arg's free indices
        assert free == [_ci("c", DN)]

    def test_functional_op_in_sum(self):
        """Tr(T) + Tr(S) in a sum — both have zero free indices, sum is valid."""
        analyzer = IndexAnalyzer()
        t1 = ValidationToken(head="Trace", args=[_leaf("T")])
        t2 = ValidationToken(head="Trace", args=[_leaf("S")])
        token = _add(t1, t2)
        assert analyzer.free_indices(token) == []


# ===========================================================================
# IndexAnalyzer.all_indices
# ===========================================================================


class TestAllIndices:
    def test_leaf(self):
        analyzer = IndexAnalyzer()
        token = _leaf("T", _ci("a", UP), _ci("b", DN))
        assert analyzer.all_indices(token) == [_ci("a", UP), _ci("b", DN)]

    def test_multiply_no_removal(self):
        analyzer = IndexAnalyzer()
        token = _mul(_leaf("A", _ci("a", DN)), _leaf("B", _ci("a", UP)))
        result = analyzer.all_indices(token)
        assert len(result) == 2  # does NOT remove contracted pairs

    def test_negate_delegates(self):
        analyzer = IndexAnalyzer()
        token = _neg(_leaf("A", _ci("a", UP)))
        assert analyzer.all_indices(token) == [_ci("a", UP)]

    def test_number_empty(self):
        analyzer = IndexAnalyzer()
        assert analyzer.all_indices(_num()) == []

    # --- Bug fix: chacana-y74 (Add examines all args) ---

    def test_add_valid_sum_returns_representative(self):
        """Valid sum (same free indices) returns those indices."""
        analyzer = IndexAnalyzer()
        token = _add(
            _leaf("A", _ci("a", UP)),
            _leaf("B", _ci("a", UP)),
        )
        result = analyzer.all_indices(token)
        assert result == [_ci("a", UP)]

    def test_add_examines_all_args(self):
        """Add with extra index in term 2 includes it (fixes chacana-y74)."""
        analyzer = IndexAnalyzer()
        token = _add(
            _leaf("A", _ci("a", UP)),
            _leaf("B", _ci("a", UP), _ci("c", UP)),
        )
        result = analyzer.all_indices(token)
        labels = {idx.label for idx in result}
        assert "c" in labels, "Index from second Add term must be visible"

    def test_add_empty_args(self):
        analyzer = IndexAnalyzer()
        token = ValidationToken(head="Add", args=[])
        assert analyzer.all_indices(token) == []


# ===========================================================================
# IndexAnalyzer.contracted_pairs
# ===========================================================================


class TestContractedPairs:
    def test_simple_contraction(self):
        analyzer = IndexAnalyzer()
        token = _mul(_leaf("A", _ci("a", DN)), _leaf("B", _ci("a", UP)))
        pairs = analyzer.contracted_pairs(token)
        assert len(pairs) == 1
        assert pairs[0] == (_ci("a", DN), _ci("a", UP))

    def test_no_contraction(self):
        analyzer = IndexAnalyzer()
        token = _mul(_leaf("A", _ci("a", DN)), _leaf("B", _ci("b", UP)))
        assert analyzer.contracted_pairs(token) == []

    def test_metric_aware_pairs(self, metric_context):
        analyzer = IndexAnalyzer(metric_context)
        token = _mul(_leaf("A", _ci("a", DN)), _leaf("B", _ci("a", DN)))
        pairs = analyzer.contracted_pairs(token)
        assert len(pairs) == 1, "Metric-aware analyzer should find same-variance pair"


# ===========================================================================
# IndexAnalyzer.remove_contracted
# ===========================================================================


class TestRemoveContracted:
    def test_opposite_variance_paired(self):
        analyzer = IndexAnalyzer()
        indices = [_ci("a", DN), _ci("a", UP)]
        assert analyzer.remove_contracted(indices) == []

    def test_same_variance_not_paired_without_metric(self):
        analyzer = IndexAnalyzer()
        indices = [_ci("a", DN), _ci("a", DN)]
        assert len(analyzer.remove_contracted(indices)) == 2

    def test_same_variance_paired_with_metric(self, metric_context):
        analyzer = IndexAnalyzer(metric_context)
        indices = [_ci("a", DN), _ci("a", DN)]
        assert analyzer.remove_contracted(indices) == []

    def test_mismatched_index_type_not_paired(self):
        analyzer = IndexAnalyzer()
        indices = [_ci("a", DN, IndexType.LATIN), _ci("a", UP, IndexType.GREEK)]
        assert len(analyzer.remove_contracted(indices)) == 2


# ===========================================================================
# Integration: bug fixes through checker.check()
# ===========================================================================


class TestBugFix6si:
    """chacana-6si: metric-aware contraction in free index invariance."""

    def test_metric_contraction_in_sum_valid(self, metric_context):
        """A{_a} * B{_a} + C should be valid with active_metric."""
        token = _add(
            _mul(_leaf("A", _ci("a", DN)), _leaf("B", _ci("a", DN))),
            _leaf("C"),
        )
        check(token, metric_context)  # should NOT raise

    def test_metric_contraction_sum_two_terms(self, metric_context):
        """A{_a} * B{_a} + C{_b} * D{_b} valid with active_metric."""
        token = _add(
            _mul(_leaf("A", _ci("a", DN)), _leaf("B", _ci("a", DN))),
            _mul(_leaf("C", _ci("b", DN)), _leaf("D", _ci("b", DN))),
        )
        check(token, metric_context)  # should NOT raise


class TestBugFix8gv:
    """chacana-8gv: wedge product index validation."""

    def test_wedge_triple_index_detected(self):
        """Index appearing 3+ times in wedge should fail."""
        token = _wedge(
            _leaf("A", _ci("a", DN)),
            _leaf("B", _ci("a", UP)),
            _leaf("C", _ci("a", DN)),
        )
        with pytest.raises(ChacanaTypeError, match="3 times"):
            check(token)

    def test_wedge_index_type_mismatch_detected(self):
        """Mismatched index_type in wedge should fail."""
        token = _wedge(
            _leaf("A", _ci("a", DN, IndexType.LATIN)),
            _leaf("B", _ci("a", UP, IndexType.GREEK)),
        )
        with pytest.raises(ChacanaTypeError, match="index.type"):
            check(token)

    def test_wedge_valid_same_label_passes(self):
        """Same label, opposite variance in wedge is valid (just = 0)."""
        token = _wedge(
            _leaf("A", _ci("a", DN)),
            _leaf("B", _ci("a", UP)),
        )
        check(token)  # should NOT raise


class TestBugFixY74:
    """chacana-y74: contraction check sees all Add args."""

    def test_hidden_contraction_error_in_sum_detected(self):
        """(A{^a} + B{^a ^c}) * C{_a} * D{^c} — ^c same-variance error from B."""
        token = _mul(
            _add(
                _leaf("A", _ci("a", UP)),
                _leaf("B", _ci("a", UP), _ci("c", UP)),
            ),
            _leaf("C", _ci("a", DN)),
            _leaf("D", _ci("c", UP)),
        )
        with pytest.raises(ChacanaTypeError):
            check(token)
