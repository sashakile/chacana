"""Tests for parse-tree → AST visitor."""

import pytest

from chacana.ast import Variance
from chacana.grammar import create_parser
from chacana.visitor import parse_to_ast


def _parse(expr: str):
    parser = create_parser()
    tree = parser.parse(expr)
    return parse_to_ast(tree)


class TestVisitorTensors:
    def test_riemann_tensor(self):
        token = _parse("R{^a _b _c _d}")
        assert token.head == "R"
        assert len(token.indices) == 4
        assert token.indices[0].name == "a"
        assert token.indices[0].variance == Variance.CONTRA
        assert token.indices[1].name == "b"
        assert token.indices[1].variance == Variance.COVAR

    def test_rank2(self):
        token = _parse("T{^a _b}")
        assert token.head == "T"
        assert len(token.indices) == 2

    def test_bare_identifier(self):
        token = _parse("A")
        assert token.head == "A"
        assert token.indices == []


class TestVisitorOperations:
    def test_sum(self):
        token = _parse("A + B")
        assert token.head == "Add"
        assert len(token.args) == 2
        assert token.args[0].head == "A"
        assert token.args[1].head == "B"

    def test_sum_with_indices(self):
        token = _parse("A{^a} + B{^a}")
        assert token.head == "Add"
        assert token.args[0].indices[0].variance == Variance.CONTRA

    def test_product(self):
        token = _parse("A{_a} * B{^a}")
        assert token.head == "Multiply"
        assert len(token.args) == 2

    def test_scalar(self):
        token = _parse("42")
        assert token.head == "Number"
        assert token.value == 42.0

    def test_scalar_float(self):
        token = _parse("3.14")
        assert token.head == "Number"
        assert token.value == pytest.approx(3.14)


class TestVisitorSerialization:
    def test_to_dict_roundtrip(self):
        token = _parse("R{^a _b _c _d}")
        d = token.to_dict()
        assert d["head"] == "R"
        assert d["indices"][0] == {"name": "a", "variance": "Contra", "type": "Latin"}
        assert d["indices"][3] == {"name": "d", "variance": "Covar", "type": "Latin"}
