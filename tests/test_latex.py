"""Tests for the Python LaTeX transpiler."""

import re

from chacana.ast import (
    HEAD_ADD,
    HEAD_DETERMINANT,
    HEAD_LIE_DERIVATIVE,
    HEAD_MULTIPLY,
    HEAD_NEGATE,
    HEAD_NUMBER,
    ChacanaIndex,
    IndexType,
    TokenMetadata,
    ValidationToken,
    Variance,
)
from chacana.latex import from_latex, to_latex

# --- helpers ---


def _idx(label, variance, **opts):
    return ChacanaIndex(
        label=label,
        variance=variance,
        index_type=IndexType.GREEK if re.match(r"[\u0391-\u03C9]", label) else IndexType.LATIN,
        is_derivative=opts.get("is_derivative", False),
        derivative_type=opts.get("derivative_type"),
    )


def contra(label):
    return _idx(label, Variance.CONTRA)


def covar(label):
    return _idx(label, Variance.COVAR)


def _token(head, args=None, indices=None, value=None, metadata=None):
    """Build a ValidationToken with the given properties."""
    return ValidationToken(
        head=head,
        args=args or [],
        indices=indices or [],
        value=value,
        metadata=metadata
        or TokenMetadata(
            symmetrized_groups=[],
            antisymmetrized_groups=[],
            order=None,
        ),
    )


# ---------------------------------------------------------------------------
# to_latex tests
# ---------------------------------------------------------------------------


class TestToLatex:
    def test_scalar_identifier(self):
        token = _token("x")
        assert to_latex(token) == "x"

    def test_numeric_coefficient_with_tensor(self):
        two = _token(HEAD_NUMBER, value=2)
        T = _token("T", indices=[contra("a"), covar("b")])
        product = _token(HEAD_MULTIPLY, args=[two, T])
        assert to_latex(product) == "2 T^{a}{}_{b}"

    def test_standard_riemann(self):
        R = _token(
            "R",
            indices=[
                contra("a"),
                covar("b"),
                covar("c"),
                covar("d"),
            ],
        )
        assert to_latex(R) == "R^{a}{}_{b c d}"

    def test_greek_indices(self):
        T = _token("T", indices=[contra("α"), covar("β")])
        assert to_latex(T) == "T^{\\alpha}{}_{\\beta}"

    def test_staggered_mixed_variance(self):
        R = _token(
            "R",
            indices=[
                contra("a"),
                covar("b"),
                contra("c"),
                covar("d"),
            ],
        )
        assert to_latex(R) == "R^{a}{}_{b}{}^{c}{}_{d}"

    def test_lie_derivative(self):
        X = _token("X")
        g = _token("g", indices=[covar("a"), covar("b")])
        lie = _token(HEAD_LIE_DERIVATIVE, args=[X, g])
        assert to_latex(lie) == "\\mathcal{L}_{X} g_{a b}"

    def test_determinant(self):
        g = _token("g", indices=[covar("a"), covar("b")])
        det = _token(HEAD_DETERMINANT, args=[g])
        assert to_latex(det) == "\\det(g_{a b})"

    def test_covariant_derivative(self):
        T = _token(
            "T",
            indices=[
                covar("a"),
                _idx("b", Variance.COVAR, is_derivative=True, derivative_type="semicolon"),
            ],
        )
        assert to_latex(T) == "T_{a ;\\! b}"

    def test_negation(self):
        T = _token("T", indices=[contra("a"), covar("b")])
        neg = _token(HEAD_NEGATE, args=[T])
        assert to_latex(neg) == "-T^{a}{}_{b}"

    def test_symmetrized_indices(self):
        meta = TokenMetadata(
            symmetrized_groups=[[0, 1]],
            antisymmetrized_groups=[],
            order=None,
        )
        T = _token("T", indices=[covar("a"), covar("b")], metadata=meta)
        assert to_latex(T) == "T_{(a b)}"

    def test_antisymmetrized_indices(self):
        meta = TokenMetadata(
            symmetrized_groups=[],
            antisymmetrized_groups=[[0, 1]],
            order=None,
        )
        T = _token("T", indices=[covar("a"), covar("b")], metadata=meta)
        assert to_latex(T) == "T_{[a b]}"

    def test_subtraction(self):
        A = _token("A")
        B = _token("B")
        neg = _token(HEAD_NEGATE, args=[B])
        s = _token(HEAD_ADD, args=[A, neg])
        assert to_latex(s) == "A - B"

    def test_negation_of_compound(self):
        A = _token("A")
        B = _token("B")
        s = _token(HEAD_ADD, args=[A, B])
        neg = _token(HEAD_NEGATE, args=[s])
        assert to_latex(neg) == "-(A + B)"


# ---------------------------------------------------------------------------
# from_latex tests
# ---------------------------------------------------------------------------


class TestFromLatex:
    def test_basic_tensor(self):
        result = from_latex("R_{abc}^{d}")
        assert result.ok
        assert result.value == "R{_a _b _c ^d}"

    def test_tensor_superscript_first(self):
        result = from_latex("T^{a}{}_{b}")
        assert result.ok
        assert result.value == "T{^a _b}"

    def test_staggered_indices(self):
        result = from_latex("R^{a}{}_{b}{}^{c}{}_{d}")
        assert result.ok
        assert result.value == "R{^a _b ^c _d}"

    def test_greek_latex_commands(self):
        result = from_latex("T^{\\alpha}{}_{\\beta}")
        assert result.ok
        assert result.value == "T{^α _β}"

    def test_arithmetic_operator_normalization(self):
        result = from_latex("A + B \\cdot C")
        assert result.ok
        assert result.value == "A + B * C"

    def test_times_normalization(self):
        result = from_latex("A \\times B")
        assert result.ok
        assert result.value == "A * B"

    def test_scalar_identifier(self):
        result = from_latex("x")
        assert result.ok
        assert result.value == "x"

    def test_omega(self):
        result = from_latex("\\omega")
        assert result.ok
        assert result.value == "ω"

    def test_strip_left_right(self):
        result = from_latex("\\left( A + B \\right)")
        assert result.ok
        assert result.value == "(A + B)"

    def test_unsupported_frac(self):
        result = from_latex("\\frac{1}{2} R_{abcd}")
        assert not result.ok
        assert "frac" in result.error

    def test_unsupported_sqrt(self):
        result = from_latex("\\sqrt{x}")
        assert not result.ok
        assert "sqrt" in result.error

    def test_wedge(self):
        result = from_latex("A \\wedge B")
        assert result.ok
        assert result.value == "A ^ B"

    def test_det(self):
        result = from_latex("\\det(g_{ab})")
        assert result.ok
        assert result.value == "det(g{_a _b})"

    def test_lie_derivative(self):
        result = from_latex("\\mathcal{L}_{X} g_{ab}")
        assert result.ok
        assert result.value == "L(X, g{_a _b})"

    def test_star(self):
        result = from_latex("\\star(\\omega)")
        assert result.ok
        assert result.value == "star(ω)"

    def test_numeric_coefficient(self):
        result = from_latex("2 T^{a}{}_{b}")
        assert result.ok
        assert result.value == "2 * T{^a _b}"

    def test_nabla_covariant_derivative(self):
        result = from_latex("\\nabla_{e} T^{bc}")
        assert result.ok
        assert result.value == "T{^b ^c ;e}"

    def test_nabla_single_char(self):
        result = from_latex("\\nabla_e T^{bc}")
        assert result.ok
        assert result.value == "T{^b ^c ;e}"

    def test_nabla_in_product(self):
        result = from_latex("R^{a}_{bcd} \\nabla_{e} T^{bc}")
        assert result.ok
        assert result.value == "R{^a _b _c _d} * T{^b ^c ;e}"

    def test_adjacent_tensors_product(self):
        result = from_latex("R^{a}_{bcd} g^{bd}")
        assert result.ok
        assert result.value == "R{^a _b _c _d} * g{^b ^d}"

    def test_bare_tensor_names(self):
        result = from_latex("A B")
        assert result.ok
        assert result.value == "A * B"
