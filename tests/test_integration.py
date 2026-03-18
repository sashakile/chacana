"""End-to-end integration tests: string → validated token."""

import pytest

import chacana
from chacana.errors import ChacanaParseError, ChacanaTypeError


class TestEndToEnd:
    def test_riemann_tensor(self, basic_context):
        result = chacana.parse("R{^a _b _c _d}", context=basic_context)
        assert result["head"] == "R"
        assert len(result["indices"]) == 4
        assert result["type"] == "TensorExpression"
        assert result["indices"][0] == {"label": "a", "variance": "Contra", "type": "Latin"}

    def test_sum_valid(self, basic_context):
        result = chacana.parse("A{^a} + B{^a}", context=basic_context)
        assert result["head"] == "Add"
        assert len(result["args"]) == 2

    def test_sum_variance_mismatch(self, basic_context):
        with pytest.raises(ChacanaTypeError, match="Free index mismatch"):
            chacana.parse("A{^a} + B{_a}", context=basic_context)

    def test_contraction(self, contraction_context):
        result = chacana.parse("A{_a} * B{^a}", context=contraction_context)
        assert result["head"] == "Multiply"

    def test_parse_error(self):
        with pytest.raises(ChacanaParseError):
            chacana.parse("R{?a}")

    def test_without_context(self):
        result = chacana.parse("T{^a _b}")
        assert result["head"] == "T"

    def test_scalar_expression(self):
        result = chacana.parse("42")
        assert result["head"] == "Number"
        assert result["value"] == 42.0

    def test_rank2(self, basic_context):
        result = chacana.parse("T{^a _b}", context=basic_context)
        assert result["head"] == "T"
        assert len(result["indices"]) == 2
