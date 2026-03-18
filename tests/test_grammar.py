"""Tests for PEG grammar acceptance/rejection."""

import pytest
from arpeggio import NoMatch

from chacana.grammar import create_parser


@pytest.fixture
def parser():
    return create_parser()


class TestGrammarAccepts:
    def test_simple_tensor(self, parser):
        result = parser.parse("R{^a _b _c _d}")
        assert result is not None

    def test_bare_identifier(self, parser):
        result = parser.parse("A")
        assert result is not None

    def test_sum(self, parser):
        result = parser.parse("A + B")
        assert result is not None

    def test_sum_with_indices(self, parser):
        result = parser.parse("A{^a} + B{^a}")
        assert result is not None

    def test_product(self, parser):
        result = parser.parse("A * B")
        assert result is not None

    def test_product_with_indices(self, parser):
        result = parser.parse("A{_a} * B{^a}")
        assert result is not None

    def test_scalar(self, parser):
        result = parser.parse("42")
        assert result is not None

    def test_scalar_float(self, parser):
        result = parser.parse("3.14")
        assert result is not None

    def test_parenthesized(self, parser):
        result = parser.parse("(A + B)")
        assert result is not None

    def test_rank2_tensor(self, parser):
        result = parser.parse("T{^a _b}")
        assert result is not None

    def test_greek_indices(self, parser):
        result = parser.parse("T{^α _β}")
        assert result is not None


class TestGrammarRejects:
    def test_invalid_variance(self, parser):
        with pytest.raises(NoMatch):
            parser.parse("R{?a}")

    def test_empty(self, parser):
        with pytest.raises(NoMatch):
            parser.parse("")

    def test_empty_braces(self, parser):
        with pytest.raises(NoMatch):
            parser.parse("R{}")

    def test_trailing_operator(self, parser):
        with pytest.raises(NoMatch):
            parser.parse("A +")
