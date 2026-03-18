"""Tests for static type checker."""

import pytest

from chacana.ast import ChacanaIndex, ValidationToken, Variance
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
                ValidationToken(head="A", indices=[
                    ChacanaIndex("a", Variance.COVAR),
                ]),
                ValidationToken(head="B", indices=[
                    ChacanaIndex("a", Variance.COVAR),
                ]),
            ],
        )
        with pytest.raises(ChacanaTypeError, match="same variance"):
            check(token)


class TestFreeIndexInvariance:
    def test_matching_free_indices(self, basic_context):
        token = _make_token("A{^a} + B{^a}")
        check(token, basic_context)  # should not raise

    def test_mismatched_variance_in_sum(self):
        token = ValidationToken(
            head="Add",
            args=[
                ValidationToken(head="A", indices=[
                    ChacanaIndex("a", Variance.CONTRA),
                ]),
                ValidationToken(head="B", indices=[
                    ChacanaIndex("a", Variance.COVAR),
                ]),
            ],
        )
        with pytest.raises(ChacanaTypeError, match="Free index mismatch"):
            check(token)

    def test_different_index_names_in_sum(self):
        token = ValidationToken(
            head="Add",
            args=[
                ValidationToken(head="A", indices=[
                    ChacanaIndex("a", Variance.CONTRA),
                ]),
                ValidationToken(head="B", indices=[
                    ChacanaIndex("b", Variance.CONTRA),
                ]),
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
