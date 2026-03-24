"""Tests for parse-tree → AST visitor."""

import pytest

from chacana.ast import IndexType, Variance
from chacana.grammar import create_parser, normalize_input, parse_and_validate
from chacana.visitor import parse_to_ast


def _parse(expr: str):
    parser = create_parser()
    tree = parser.parse(expr)
    return parse_to_ast(tree)


def _parse_full(expr: str):
    """Parse with full normalization (needed for Unicode/Greek input)."""
    expr = normalize_input(expr)
    tree = parse_and_validate(expr)
    return parse_to_ast(tree)


class TestVisitorTensors:
    def test_riemann_tensor(self):
        token = _parse("R{^a _b _c _d}")
        assert token.head == "R"
        assert len(token.indices) == 4
        assert token.indices[0].label == "a"
        assert token.indices[0].variance == Variance.CONTRA
        assert token.indices[1].label == "b"
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


class TestVisitorWedgeProduct:
    def test_wedge_basic(self):
        token = _parse("A ^ B")
        assert token.head == "Wedge"
        assert len(token.args) == 2
        assert token.args[0].head == "A"
        assert token.args[1].head == "B"


class TestVisitorFunctionalOps:
    def test_exterior_derivative(self):
        token = _parse("d(omega)")
        assert token.head == "ExteriorDerivative"
        assert len(token.args) == 1
        assert token.args[0].head == "omega"

    def test_lie_derivative(self):
        token = _parse("L(X, T)")
        assert token.head == "LieDerivative"
        assert len(token.args) == 2
        assert token.args[0].head == "X"
        assert token.args[1].head == "T"

    def test_trace(self):
        token = _parse("Tr(T)")
        assert token.head == "Trace"
        assert len(token.args) == 1
        assert token.args[0].head == "T"


class TestVisitorPerturbation:
    def test_perturbation(self):
        token = _parse("@2(A)")
        assert token.head == "Perturbation"
        assert len(token.args) == 1
        assert token.args[0].head == "A"
        assert token.metadata.order == 2


class TestVisitorCommutator:
    def test_commutator(self):
        token = _parse("[A, B]")
        assert token.head == "Commutator"
        assert len(token.args) == 2
        assert token.args[0].head == "A"
        assert token.args[1].head == "B"


class TestVisitorDerivatives:
    def test_semicolon_derivative(self):
        token = _parse("T{;a}")
        assert token.head == "T"
        assert len(token.indices) == 1
        idx = token.indices[0]
        assert idx.label == "a"
        assert idx.is_derivative is True
        assert idx.derivative_type == "Semicolon"

    def test_comma_derivative(self):
        token = _parse("T{,a}")
        assert token.head == "T"
        assert len(token.indices) == 1
        idx = token.indices[0]
        assert idx.label == "a"
        assert idx.is_derivative is True
        assert idx.derivative_type == "Comma"


class TestVisitorThreeTermSum:
    def test_three_term_sum_flat(self):
        token = _parse("A + B + C")
        assert token.head == "Add"
        assert len(token.args) == 3
        assert token.args[0].head == "A"
        assert token.args[1].head == "B"
        assert token.args[2].head == "C"


class TestVisitorNestedExpression:
    def test_nested_product_plus_scalar(self):
        token = _parse("(A{_a} * B{^a}) + C")
        assert token.head == "Add"
        assert len(token.args) == 2
        product = token.args[0]
        assert product.head == "Multiply"
        assert len(product.args) == 2
        assert product.args[0].head == "A"
        assert product.args[0].indices[0].label == "a"
        assert product.args[0].indices[0].variance == Variance.COVAR
        assert product.args[1].head == "B"
        assert product.args[1].indices[0].label == "a"
        assert product.args[1].indices[0].variance == Variance.CONTRA
        assert token.args[1].head == "C"


class TestVisitorGreekIndices:
    def test_greek_index_type_detection(self):
        token = _parse_full("T{^\u03b1}")  # T{^α}
        assert token.head == "T"
        assert len(token.indices) == 1
        idx = token.indices[0]
        assert idx.label == "\u03b1"
        assert idx.index_type == IndexType.GREEK
        assert idx.variance == Variance.CONTRA


class TestVisitorSubtraction:
    def test_subtraction_produces_negate(self):
        """A - B should produce Add(A, Negate(B)), not Add(A, B)."""
        token = _parse("A - B")
        assert token.head == "Add"
        assert len(token.args) == 2
        assert token.args[0].head == "A"
        assert token.args[1].head == "Negate"
        assert token.args[1].args[0].head == "B"

    def test_subtraction_with_indices(self):
        token = _parse("A{^a} - B{^a}")
        assert token.head == "Add"
        assert token.args[1].head == "Negate"
        inner = token.args[1].args[0]
        assert inner.head == "B"
        assert inner.indices[0].variance == Variance.CONTRA

    def test_mixed_add_subtract(self):
        """A + B - C should produce Add(A, B, Negate(C))."""
        token = _parse("A + B - C")
        assert token.head == "Add"
        assert len(token.args) == 3
        assert token.args[0].head == "A"
        assert token.args[1].head == "B"
        assert token.args[2].head == "Negate"
        assert token.args[2].args[0].head == "C"


class TestVisitorSymmetrization:
    def test_symmetrization_indices(self):
        token = _parse("T{_( a b _)}")
        assert token.head == "T"
        assert len(token.indices) == 2
        assert token.indices[0].label == "a"
        assert token.indices[0].variance == Variance.COVAR
        assert token.indices[1].label == "b"
        assert token.indices[1].variance == Variance.COVAR

    def test_symmetrization_metadata(self):
        """Symmetrized groups should be recorded in metadata."""
        token = _parse("T{_( a b _)}")
        assert token.metadata.symmetrized_groups == [[0, 1]]

    def test_anti_symmetrization_metadata(self):
        """Anti-symmetrized groups should be recorded in metadata."""
        token = _parse("T{_[ a b _]}")
        assert token.metadata.antisymmetrized_groups == [[0, 1]]

    def test_mixed_sym_and_plain_indices(self):
        """T{^c _( a b _)} should have sym group at positions [1, 2]."""
        token = _parse("T{^c _( a b _)}")
        assert len(token.indices) == 3
        assert token.indices[0].label == "c"
        assert token.metadata.symmetrized_groups == [[1, 2]]

    def test_bare_index_defaults_to_covariant(self):
        """Bare index without variance marker defaults to covariant."""
        token = _parse("T{a}")
        assert len(token.indices) == 1
        assert token.indices[0].label == "a"
        assert token.indices[0].variance == Variance.COVAR


class TestVisitorScalarMultiplication:
    def test_scalar_times_tensor(self):
        token = _parse("3 * T{^a}")
        assert token.head == "Multiply"
        assert len(token.args) == 2
        assert token.args[0].head == "Number"
        assert token.args[0].value == 3.0
        assert token.args[1].head == "T"
        assert len(token.args[1].indices) == 1
        assert token.args[1].indices[0].label == "a"
        assert token.args[1].indices[0].variance == Variance.CONTRA


class TestVisitorSerialization:
    def test_to_dict_roundtrip(self):
        token = _parse("R{^a _b _c _d}")
        d = token.to_dict()
        assert d["head"] == "R"
        assert d["type"] == "TensorExpression"
        assert d["indices"][0] == {"label": "a", "variance": "Contra", "type": "Latin"}
        assert d["indices"][3] == {"label": "d", "variance": "Covar", "type": "Latin"}
