"""Tests for static type checker."""

import pytest

from chacana.ast import ChacanaIndex, IndexType, ValidationToken, Variance
from chacana.checker import check
from chacana.errors import ChacanaTypeError
from chacana.grammar import create_parser
from chacana.visitor import parse_to_ast


def _make_token(expr: str) -> ValidationToken:
    parser = create_parser()
    tree = parser.parse(expr)
    return parse_to_ast(tree)


class TestContraction:
    def test_valid_contraction(self, contraction_context):
        token = _make_token("A{_a} * B{^a}")
        check(token, contraction_context)  # should not raise

    def test_same_variance_contraction_fails(self):
        token = ValidationToken(
            head="Multiply",
            args=[
                ValidationToken(
                    head="A",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR),
                    ],
                ),
                ValidationToken(
                    head="B",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR),
                    ],
                ),
            ],
        )
        with pytest.raises(ChacanaTypeError, match="same variance"):
            check(token)

    def test_metric_aware_contraction(self, metric_context):
        # A{_a} * B{_a} is allowed if active_metric is defined
        token = _make_token("A{_a} * B{_a}")
        check(token, metric_context)  # should not raise


class TestWedge:
    def test_wedge_free_indices(self):
        token = _make_token("A{_a} ^ B{_b}")
        # check() validates but doesn't return free indices
        check(token)

    def test_wedge_no_contraction(self):
        # In a wedge product, same names don't necessarily contract like in Multiply
        token = _make_token("A{_a} ^ B{^a}")
        check(token)


class TestFreeIndexInvariance:
    def test_matching_free_indices(self, basic_context):
        token = _make_token("A{^a} + B{^a}")
        check(token, basic_context)  # should not raise

    def test_mismatched_variance_in_sum(self):
        token = ValidationToken(
            head="Add",
            args=[
                ValidationToken(
                    head="A",
                    indices=[
                        ChacanaIndex("a", Variance.CONTRA),
                    ],
                ),
                ValidationToken(
                    head="B",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR),
                    ],
                ),
            ],
        )
        with pytest.raises(ChacanaTypeError, match="Free index mismatch"):
            check(token)

    def test_different_index_names_in_sum(self):
        token = ValidationToken(
            head="Add",
            args=[
                ValidationToken(
                    head="A",
                    indices=[
                        ChacanaIndex("a", Variance.CONTRA),
                    ],
                ),
                ValidationToken(
                    head="B",
                    indices=[
                        ChacanaIndex("b", Variance.CONTRA),
                    ],
                ),
            ],
        )
        with pytest.raises(ChacanaTypeError, match="Free index mismatch"):
            check(token)


class TestRankCheck:
    def test_correct_rank(self, basic_context):
        token = _make_token("R{^a _b _c _d}")
        check(token, basic_context)  # should not raise

    def test_wrong_rank(self, basic_context):
        token = ValidationToken(
            head="R",
            indices=[
                ChacanaIndex("a", Variance.CONTRA),
                ChacanaIndex("b", Variance.COVAR),
            ],
        )
        with pytest.raises(ChacanaTypeError, match="rank 4.*2 indices"):
            check(token, basic_context)

    def test_wrong_variance_pattern(self, basic_context):
        token = ValidationToken(
            head="R",
            indices=[
                ChacanaIndex("a", Variance.COVAR),  # should be Contra
                ChacanaIndex("b", Variance.COVAR),
                ChacanaIndex("c", Variance.COVAR),
                ChacanaIndex("d", Variance.COVAR),
            ],
        )
        with pytest.raises(ChacanaTypeError, match="index 0.*expected Contra.*got Covar"):
            check(token, basic_context)


# ---------------------------------------------------------------------------
# Rule 1 completion: index_type check in contraction
# ---------------------------------------------------------------------------


class TestContractionIndexType:
    """Contraction requires matching index_type (Latin vs Greek)."""

    def test_mismatched_index_type_contraction_fails(self):
        """Latin 'a' and Greek 'a' must NOT contract."""
        token = ValidationToken(
            head="Multiply",
            args=[
                ValidationToken(
                    head="A",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR, index_type=IndexType.LATIN),
                    ],
                ),
                ValidationToken(
                    head="B",
                    indices=[
                        ChacanaIndex("a", Variance.CONTRA, index_type=IndexType.GREEK),
                    ],
                ),
            ],
        )
        with pytest.raises(ChacanaTypeError, match="index.type"):
            check(token)

    def test_matching_index_type_contraction_succeeds(self):
        """Same label, opposite variance, same index_type should contract."""
        token = ValidationToken(
            head="Multiply",
            args=[
                ValidationToken(
                    head="A",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR, index_type=IndexType.LATIN),
                    ],
                ),
                ValidationToken(
                    head="B",
                    indices=[
                        ChacanaIndex("a", Variance.CONTRA, index_type=IndexType.LATIN),
                    ],
                ),
            ],
        )
        check(token)  # should not raise

    def test_greek_greek_contraction_succeeds(self):
        """Two Greek indices with same label and opposite variance contract."""
        token = ValidationToken(
            head="Multiply",
            args=[
                ValidationToken(
                    head="A",
                    indices=[
                        ChacanaIndex("\u03b1", Variance.COVAR, index_type=IndexType.GREEK),
                    ],
                ),
                ValidationToken(
                    head="B",
                    indices=[
                        ChacanaIndex("\u03b1", Variance.CONTRA, index_type=IndexType.GREEK),
                    ],
                ),
            ],
        )
        check(token)  # should not raise

    def test_index_type_mismatch_error_message(self):
        """Error message should mention index type mismatch."""
        token = ValidationToken(
            head="Multiply",
            args=[
                ValidationToken(
                    head="A",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR, index_type=IndexType.LATIN),
                    ],
                ),
                ValidationToken(
                    head="B",
                    indices=[
                        ChacanaIndex("a", Variance.CONTRA, index_type=IndexType.GREEK),
                    ],
                ),
            ],
        )
        with pytest.raises(ChacanaTypeError, match="Latin.*Greek"):
            check(token)

    def test_index_type_mismatch_metric_aware_still_fails(self, metric_context):
        """Even with active_metric, mismatched index_type should fail."""
        token = ValidationToken(
            head="Multiply",
            args=[
                ValidationToken(
                    head="A",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR, index_type=IndexType.LATIN),
                    ],
                ),
                ValidationToken(
                    head="B",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR, index_type=IndexType.GREEK),
                    ],
                ),
            ],
        )
        with pytest.raises(ChacanaTypeError, match="index.type"):
            check(token, metric_context)


# ---------------------------------------------------------------------------
# Rule 3: Symmetry validation
# ---------------------------------------------------------------------------


class TestSymmetryValidation:
    """Symmetrized index groups must have matching variance and index_type."""

    def test_symmetrized_indices_same_variance_passes(self):
        """T{_( a b _)} with matching variance and type should pass."""
        token = _make_token("T{_( a b _)}")
        check(token)  # should not raise

    def test_symmetrized_indices_mixed_variance_fails(self):
        """T{_( a ^b _)} — mixed variance in symmetrization must fail."""
        # Build manually since grammar allows the tokens but checker should reject
        token = ValidationToken(
            head="T",
            indices=[
                ChacanaIndex("a", Variance.COVAR, index_type=IndexType.LATIN),
                ChacanaIndex("b", Variance.CONTRA, index_type=IndexType.LATIN),
            ],
            metadata={"symmetrized_groups": [[0, 1]]},
        )
        with pytest.raises(ChacanaTypeError, match="[Vv]ariance.*symmetri"):
            check(token)

    def test_symmetrized_indices_mixed_index_type_fails(self):
        """Indices of different types cannot be symmetrized."""
        token = ValidationToken(
            head="T",
            indices=[
                ChacanaIndex("a", Variance.COVAR, index_type=IndexType.LATIN),
                ChacanaIndex("b", Variance.COVAR, index_type=IndexType.GREEK),
            ],
            metadata={"symmetrized_groups": [[0, 1]]},
        )
        with pytest.raises(ChacanaTypeError, match="[Ii]ndex.type.*symmetri"):
            check(token)

    def test_anti_symmetrized_indices_same_variance_passes(self):
        """T{_[ a b _]} with matching variance and type should pass."""
        token = ValidationToken(
            head="T",
            indices=[
                ChacanaIndex("a", Variance.COVAR, index_type=IndexType.LATIN),
                ChacanaIndex("b", Variance.COVAR, index_type=IndexType.LATIN),
            ],
            metadata={"antisymmetrized_groups": [[0, 1]]},
        )
        check(token)  # should not raise

    def test_anti_symmetrized_indices_mixed_variance_fails(self):
        """Mixed variance in anti-symmetrization must fail."""
        token = ValidationToken(
            head="T",
            indices=[
                ChacanaIndex("a", Variance.COVAR, index_type=IndexType.LATIN),
                ChacanaIndex("b", Variance.CONTRA, index_type=IndexType.LATIN),
            ],
            metadata={"antisymmetrized_groups": [[0, 1]]},
        )
        with pytest.raises(ChacanaTypeError, match="[Vv]ariance.*symmetri"):
            check(token)

    def test_declared_symmetry_variance_mismatch(self, symmetric_context):
        """If context declares T symmetric in [1,2], those must match variance."""
        # T declared symmetric in slots [1,2] — but used with mixed variance
        token = ValidationToken(
            head="T",
            indices=[
                ChacanaIndex("a", Variance.COVAR, index_type=IndexType.LATIN),
                ChacanaIndex("b", Variance.CONTRA, index_type=IndexType.LATIN),
            ],
        )
        with pytest.raises(ChacanaTypeError, match="[Vv]ariance.*symmetr"):
            check(token, symmetric_context)


# ---------------------------------------------------------------------------
# More comprehensive negative-path tests
# ---------------------------------------------------------------------------


class TestContractionNegativePaths:
    """Additional negative-path tests for contraction checking."""

    def test_triple_index_fails(self):
        """Index appearing 3 times must fail."""
        token = ValidationToken(
            head="Multiply",
            args=[
                ValidationToken(
                    head="A",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR),
                    ],
                ),
                ValidationToken(
                    head="B",
                    indices=[
                        ChacanaIndex("a", Variance.CONTRA),
                    ],
                ),
                ValidationToken(
                    head="C",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR),
                    ],
                ),
            ],
        )
        with pytest.raises(ChacanaTypeError, match="3 times"):
            check(token)

    def test_sum_different_number_of_free_indices(self):
        """Sum terms with different numbers of free indices must fail."""
        token = ValidationToken(
            head="Add",
            args=[
                ValidationToken(
                    head="A",
                    indices=[
                        ChacanaIndex("a", Variance.CONTRA),
                        ChacanaIndex("b", Variance.CONTRA),
                    ],
                ),
                ValidationToken(
                    head="B",
                    indices=[
                        ChacanaIndex("a", Variance.CONTRA),
                    ],
                ),
            ],
        )
        with pytest.raises(ChacanaTypeError, match="Free index mismatch"):
            check(token)

    def test_three_term_sum_middle_wrong(self):
        """Three-term sum where middle term has wrong free indices."""
        token = ValidationToken(
            head="Add",
            args=[
                ValidationToken(
                    head="A",
                    indices=[
                        ChacanaIndex("a", Variance.CONTRA),
                    ],
                ),
                ValidationToken(
                    head="B",
                    indices=[
                        ChacanaIndex("b", Variance.CONTRA),
                    ],
                ),
                ValidationToken(
                    head="C",
                    indices=[
                        ChacanaIndex("a", Variance.CONTRA),
                    ],
                ),
            ],
        )
        with pytest.raises(ChacanaTypeError, match="Free index mismatch.*term 1"):
            check(token)

    def test_contraction_inside_sum_term(self):
        """Contraction inside a sum term should be checked."""
        # (A{_a} * B{_a}) + C{} — same variance contraction inside sum
        token = ValidationToken(
            head="Add",
            args=[
                ValidationToken(
                    head="Multiply",
                    args=[
                        ValidationToken(
                            head="A",
                            indices=[
                                ChacanaIndex("a", Variance.COVAR),
                            ],
                        ),
                        ValidationToken(
                            head="B",
                            indices=[
                                ChacanaIndex("a", Variance.COVAR),
                            ],
                        ),
                    ],
                ),
                ValidationToken(head="C", indices=[]),
            ],
        )
        with pytest.raises(ChacanaTypeError, match="same variance"):
            check(token)

    def test_nested_product_contraction_check(self):
        """Contraction errors should be caught in nested products."""
        # (A{_a} * B{_a}) * C{^b} — same-variance contraction in inner product
        token = ValidationToken(
            head="Multiply",
            args=[
                ValidationToken(
                    head="Multiply",
                    args=[
                        ValidationToken(
                            head="A",
                            indices=[
                                ChacanaIndex("a", Variance.COVAR),
                            ],
                        ),
                        ValidationToken(
                            head="B",
                            indices=[
                                ChacanaIndex("a", Variance.COVAR),
                            ],
                        ),
                    ],
                ),
                ValidationToken(
                    head="C",
                    indices=[
                        ChacanaIndex("b", Variance.CONTRA),
                    ],
                ),
            ],
        )
        with pytest.raises(ChacanaTypeError, match="same variance"):
            check(token)


# ---------------------------------------------------------------------------
# Recursion into all node types
# ---------------------------------------------------------------------------


class TestNodeTypeRecursion:
    """Checker should recurse into all expression node types."""

    def test_exterior_derivative_contraction_check(self):
        """Contraction errors inside ExteriorDerivative args should be caught."""
        inner = ValidationToken(
            head="Multiply",
            args=[
                ValidationToken(
                    head="A",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR),
                    ],
                ),
                ValidationToken(
                    head="B",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR),
                    ],
                ),
            ],
        )
        token = ValidationToken(head="ExteriorDerivative", args=[inner])
        with pytest.raises(ChacanaTypeError, match="same variance"):
            check(token)

    def test_lie_derivative_contraction_check(self):
        """Contraction errors inside LieDerivative args should be caught."""
        inner = ValidationToken(
            head="Multiply",
            args=[
                ValidationToken(
                    head="A",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR),
                    ],
                ),
                ValidationToken(
                    head="B",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR),
                    ],
                ),
            ],
        )
        token = ValidationToken(head="LieDerivative", args=[inner])
        with pytest.raises(ChacanaTypeError, match="same variance"):
            check(token)

    def test_perturbation_contraction_check(self):
        """Contraction errors inside Perturbation should be caught."""
        inner = ValidationToken(
            head="Multiply",
            args=[
                ValidationToken(
                    head="A",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR),
                    ],
                ),
                ValidationToken(
                    head="B",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR),
                    ],
                ),
            ],
        )
        token = ValidationToken(head="Perturbation", args=[inner], metadata={"order": 1})
        with pytest.raises(ChacanaTypeError, match="same variance"):
            check(token)

    def test_commutator_contraction_check(self):
        """Contraction errors inside Commutator should be caught."""
        bad_product = ValidationToken(
            head="Multiply",
            args=[
                ValidationToken(
                    head="A",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR),
                    ],
                ),
                ValidationToken(
                    head="B",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR),
                    ],
                ),
            ],
        )
        good_leaf = ValidationToken(head="C", indices=[])
        token = ValidationToken(head="Commutator", args=[bad_product, good_leaf])
        with pytest.raises(ChacanaTypeError, match="same variance"):
            check(token)

    def test_functional_op_contraction_check(self):
        """Contraction errors inside functional op args should be caught."""
        inner = ValidationToken(
            head="Multiply",
            args=[
                ValidationToken(
                    head="A",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR),
                    ],
                ),
                ValidationToken(
                    head="B",
                    indices=[
                        ChacanaIndex("a", Variance.COVAR),
                    ],
                ),
            ],
        )
        token = ValidationToken(head="Trace", args=[inner])
        with pytest.raises(ChacanaTypeError, match="same variance"):
            check(token)

    def test_valid_exterior_derivative(self):
        """Valid expression inside ExteriorDerivative should pass."""
        inner = ValidationToken(
            head="omega",
            indices=[
                ChacanaIndex("a", Variance.COVAR),
            ],
        )
        token = ValidationToken(head="ExteriorDerivative", args=[inner])
        check(token)  # should not raise

    def test_free_index_check_in_nested_sum(self):
        """Free index invariance checked in sum nested inside product."""
        bad_sum = ValidationToken(
            head="Add",
            args=[
                ValidationToken(
                    head="A",
                    indices=[
                        ChacanaIndex("a", Variance.CONTRA),
                    ],
                ),
                ValidationToken(
                    head="B",
                    indices=[
                        ChacanaIndex("b", Variance.CONTRA),
                    ],
                ),
            ],
        )
        token = ValidationToken(
            head="Multiply",
            args=[
                bad_sum,
                ValidationToken(
                    head="C",
                    indices=[
                        ChacanaIndex("c", Variance.COVAR),
                    ],
                ),
            ],
        )
        with pytest.raises(ChacanaTypeError, match="Free index mismatch"):
            check(token)


# ---------------------------------------------------------------------------
# Negate handling
# ---------------------------------------------------------------------------


class TestNegate:
    """Tests for Negate node handling (subtraction produces Add + Negate)."""

    def test_negate_free_indices(self):
        """Negate(A{^a}) should have the same free indices as A{^a}."""
        token = _make_token("A{^a} - B{^a}")
        check(token)  # should not raise — free indices match

    def test_negate_preserves_contraction_check(self):
        """Subtraction with mismatched free indices should still fail."""
        token = ValidationToken(
            head="Add",
            args=[
                ValidationToken(
                    head="A",
                    indices=[ChacanaIndex("a", Variance.CONTRA)],
                ),
                ValidationToken(
                    head="Negate",
                    args=[
                        ValidationToken(
                            head="B",
                            indices=[ChacanaIndex("b", Variance.CONTRA)],
                        )
                    ],
                ),
            ],
        )
        with pytest.raises(ChacanaTypeError, match="Free index mismatch"):
            check(token)


# ---------------------------------------------------------------------------
# Empty-args functional op
# ---------------------------------------------------------------------------


class TestEmptyArgsFunctionalOp:
    """d() and similar with no args should not crash the checker."""

    def test_d_empty_args_no_crash(self):
        """d() should not crash when type-checked."""
        token = _make_token("d()")
        check(token)  # should not raise or crash

    def test_d_empty_args_with_context(self, basic_context):
        """d() with context should not crash."""
        token = _make_token("d()")
        check(token, basic_context)  # should not crash
