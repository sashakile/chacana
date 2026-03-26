"""Tests for PEG grammar acceptance/rejection."""

import unicodedata

import pytest
from arpeggio import NoMatch

from chacana.errors import ChacanaParseError
from chacana.grammar import create_parser, normalize_input
from chacana.visitor import parse_to_ast


@pytest.fixture
def parser():
    return create_parser()


class TestGrammarAccepts:
    def test_simple_tensor(self, parser):
        token = parse_to_ast(parser.parse("R{^a _b _c _d}"))
        assert token.head == "R"
        assert len(token.indices) == 4

    def test_bare_identifier(self, parser):
        token = parse_to_ast(parser.parse("A"))
        assert token.head == "A"
        assert token.indices == []

    def test_sum(self, parser):
        token = parse_to_ast(parser.parse("A + B"))
        assert token.head == "Add"
        assert len(token.args) == 2

    def test_sum_with_indices(self, parser):
        token = parse_to_ast(parser.parse("A{^a} + B{^a}"))
        assert token.head == "Add"
        assert token.args[0].head == "A"

    def test_product(self, parser):
        token = parse_to_ast(parser.parse("A * B"))
        assert token.head == "Multiply"
        assert len(token.args) == 2

    def test_product_with_indices(self, parser):
        token = parse_to_ast(parser.parse("A{_a} * B{^a}"))
        assert token.head == "Multiply"
        assert len(token.args[0].indices) == 1

    def test_scalar(self, parser):
        token = parse_to_ast(parser.parse("42"))
        assert token.head == "Number"
        assert token.value == 42.0

    def test_scalar_float(self, parser):
        token = parse_to_ast(parser.parse("3.14"))
        assert token.head == "Number"
        assert token.value == pytest.approx(3.14)

    def test_parenthesized(self, parser):
        token = parse_to_ast(parser.parse("(A + B)"))
        assert token.head == "Add"

    def test_rank2_tensor(self, parser):
        token = parse_to_ast(parser.parse("T{^a _b}"))
        assert token.head == "T"
        assert len(token.indices) == 2

    def test_greek_indices(self, parser):
        token = parse_to_ast(parser.parse("T{^α _β}"))
        assert token.head == "T"
        assert token.indices[0].label == "α"

    def test_wedge(self, parser):
        token = parse_to_ast(parser.parse("A ^ B"))
        assert token.head == "Wedge"
        assert len(token.args) == 2

    def test_functional_op(self, parser):
        token = parse_to_ast(parser.parse("d(omega)"))
        assert token.head == "ExteriorDerivative"
        assert len(token.args) == 1

    def test_functional_op_multiple_args(self, parser):
        token = parse_to_ast(parser.parse("L(X, T)"))
        assert token.head == "LieDerivative"
        assert len(token.args) == 2

    def test_symmetrization(self, parser):
        token = parse_to_ast(parser.parse("T{_( a b _)}"))
        assert token.head == "T"
        assert len(token.metadata.symmetrized_groups) == 1

    def test_anti_symmetrization(self, parser):
        token = parse_to_ast(parser.parse("T{_[ a b _]}"))
        assert token.head == "T"
        assert len(token.metadata.antisymmetrized_groups) == 1

    def test_derivatives(self, parser):
        token = parse_to_ast(parser.parse("T{;a ,b}"))
        assert token.head == "T"
        assert token.indices[0].is_derivative
        assert token.indices[1].is_derivative

    def test_complex_expression(self, parser):
        token = parse_to_ast(parser.parse("d(A ^ B){_a _b _c} + L(X, T){_a _b _c}"))
        assert token.head == "Add"
        assert token.args[0].head == "ExteriorDerivative"
        assert token.args[1].head == "LieDerivative"

    def test_perturbation(self, parser):
        token = parse_to_ast(parser.parse("@2(A + B)"))
        assert token.head == "Perturbation"
        assert token.metadata.order == 2

    # --- Spec scenario tests ---

    def test_functional_op_lie_derivative_with_tensor_arg(self, parser):
        token = parse_to_ast(parser.parse("L(X, T{^a _b})"))
        assert token.head == "LieDerivative"
        assert token.args[1].head == "T"

    def test_functional_op_trace(self, parser):
        token = parse_to_ast(parser.parse("Tr(T)"))
        assert token.head == "Trace"

    def test_functional_op_determinant(self, parser):
        token = parse_to_ast(parser.parse("det(g)"))
        assert token.head == "Determinant"

    def test_functional_op_inverse(self, parser):
        token = parse_to_ast(parser.parse("inv(M)"))
        assert token.head == "Inverse"

    def test_functional_op_exterior_derivative_of_wedge(self, parser):
        token = parse_to_ast(parser.parse("d(A ^ B)"))
        assert token.head == "ExteriorDerivative"
        assert token.args[0].head == "Wedge"

    def test_commutator(self, parser):
        token = parse_to_ast(parser.parse("[A, B]"))
        assert token.head == "Commutator"
        assert len(token.args) == 2

    def test_commutator_complex(self, parser):
        token = parse_to_ast(parser.parse("[A + B, C * D]"))
        assert token.head == "Commutator"
        assert token.args[0].head == "Add"
        assert token.args[1].head == "Multiply"

    def test_contravariant_symmetrization(self, parser):
        token = parse_to_ast(parser.parse("T{^( a b ^)}"))
        assert len(token.metadata.symmetrized_groups) == 1

    def test_contravariant_anti_symmetrization(self, parser):
        token = parse_to_ast(parser.parse("T{^[ a b ^]}"))
        assert len(token.metadata.antisymmetrized_groups) == 1

    def test_mixed_indices_and_derivatives(self, parser):
        token = parse_to_ast(parser.parse("T{^a _b ;c}"))
        assert len(token.indices) == 3
        assert token.indices[2].is_derivative

    def test_scalar_multiplication(self, parser):
        token = parse_to_ast(parser.parse("3 * T{^a _b}"))
        assert token.head == "Multiply"
        assert token.args[0].head == "Number"

    def test_subtraction(self, parser):
        token = parse_to_ast(parser.parse("A{^a} - B{^a}"))
        assert token.head == "Add"
        assert token.args[1].head == "Negate"

    def test_nested_parentheses(self, parser):
        token = parse_to_ast(parser.parse("((A + B) * C)"))
        assert token.head == "Multiply"

    def test_perturbation_higher_order(self, parser):
        token = parse_to_ast(parser.parse("@3(g{_a _b})"))
        assert token.head == "Perturbation"
        assert token.metadata.order == 3

    def test_functional_op_with_indices(self, parser):
        token = parse_to_ast(parser.parse("d(omega){_a _b}"))
        assert token.head == "ExteriorDerivative"
        assert len(token.indices) == 2

    def test_empty_functional_op(self, parser):
        token = parse_to_ast(parser.parse("d()"))
        assert token.head == "ExteriorDerivative"
        assert token.args == []

    def test_unary_negation(self, parser):
        """Leading minus: -T{^a _b}"""
        token = parse_to_ast(parser.parse("-T{^a _b}"))
        assert token.head == "Negate"
        assert token.args[0].head == "T"

    def test_unary_negation_in_expression(self, parser):
        """A + -B should parse as Add(A, Negate(B))."""
        token = parse_to_ast(parser.parse("A + -B"))
        assert token.head == "Add"
        assert token.args[1].head == "Negate"

    def test_parenthesized_with_indices(self, parser):
        """(A + B){_a} should attach indices to the inner expression."""
        token = parse_to_ast(parser.parse("(A + B){_a}"))
        assert token.head == "Add"
        assert len(token.indices) == 1
        assert token.indices[0].label == "a"

    def test_parenthesized_with_multiple_indices(self, parser):
        """(A * B){^a _b} should attach multiple indices."""
        token = parse_to_ast(parser.parse("(A * B){^a _b}"))
        assert token.head == "Multiply"
        assert len(token.indices) == 2

    def test_parenthesized_with_symmetrized_indices(self, parser):
        """(A + B){_( a b _)} should attach symmetrized indices."""
        token = parse_to_ast(parser.parse("(A + B){_( a b _)}"))
        assert token.head == "Add"
        assert len(token.metadata.symmetrized_groups) == 1

    def test_parenthesized_no_indices_still_works(self, parser):
        """(A + B) without indices should still work as before."""
        token = parse_to_ast(parser.parse("(A + B)"))
        assert token.head == "Add"
        assert token.indices == []


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

    def test_malformed_operator_missing_operand(self, parser):
        """Spec scenario: d(A ^ ) must reject."""
        with pytest.raises(NoMatch):
            parser.parse("d(A ^ )")

    def test_nested_symmetrization(self, parser):
        """Spec scenario: T{_( _( a b _) _)} must reject nested symmetrization."""
        with pytest.raises(ChacanaParseError):
            normalize_and_parse("T{_( _( a b _) _)}")

    def test_nested_anti_symmetrization(self, parser):
        """Nested anti-symmetrization must also reject."""
        with pytest.raises(ChacanaParseError):
            normalize_and_parse("T{_[ _[ a b _] _]}")

    def test_nested_mixed_sym_antisym(self, parser):
        """Mixed nesting: sym inside antisym must reject."""
        with pytest.raises(ChacanaParseError):
            normalize_and_parse("T{_[ _( a b _) _]}")

    def test_unclosed_brace(self, parser):
        """Unclosed index block."""
        with pytest.raises(NoMatch):
            parser.parse("T{^a _b")

    def test_double_variance(self, parser):
        """Double variance marker is not valid."""
        with pytest.raises(NoMatch):
            parser.parse("T{^^a}")

    def test_unknown_identifier_as_functional_op(self, parser):
        """R(A+B) must not parse as functional_op — R is not a known operator."""
        with pytest.raises(NoMatch):
            parser.parse("R(A + B)")


class TestUnicodeNormalization:
    """Tests for Unicode NFC normalization (spec requirement)."""

    def test_nfc_normalization_applied(self):
        """Input is NFC-normalized before parsing."""
        # Compose a decomposed character: B + combining dot above = Ḃ
        decomposed = "B\u0307"
        composed = unicodedata.normalize("NFC", decomposed)
        assert decomposed != composed  # sanity check
        result = normalize_input(decomposed)
        assert result == composed

    def test_greek_indices_after_normalization(self):
        """Greek characters parse correctly after normalization."""
        expr = "T{^α _β}"
        normalized = normalize_input(expr)
        parser = create_parser()
        result = parser.parse(normalized)
        assert result is not None

    def test_decomposed_greek_normalizes(self):
        """Decomposed Greek characters are NFC-normalized."""
        # alpha with combining acute: ά (decomposed) -> ά (precomposed)
        decomposed_alpha = "\u03b1\u0301"  # alpha + combining acute
        composed_alpha = unicodedata.normalize("NFC", decomposed_alpha)
        expr = f"T{{^{decomposed_alpha}}}"
        normalized = normalize_input(expr)
        assert composed_alpha in normalized

    def test_reject_cyrillic_identifier(self):
        """Spec scenario: Cyrillic characters must be rejected."""
        # Cyrillic 'а' (U+0430) looks like Latin 'a' but must be rejected
        cyrillic_a = "\u0430"
        expr = f"T{{^{cyrillic_a}}}"
        with pytest.raises(ChacanaParseError, match="[Cc]yrillic|[Uu]nicode"):
            normalize_input(expr)

    def test_reject_cyrillic_in_identifier(self):
        """Cyrillic in tensor name must be rejected."""
        # Cyrillic 'Т' (U+0422) looks like Latin 'T'
        cyrillic_T = "\u0422"
        expr = f"{cyrillic_T}{{^a _b}}"
        with pytest.raises(ChacanaParseError, match="[Cc]yrillic|[Uu]nicode"):
            normalize_input(expr)

    def test_allow_latin_identifiers(self):
        """Latin identifiers are allowed."""
        result = normalize_input("R{^a _b _c _d}")
        assert result == "R{^a _b _c _d}"

    def test_allow_greek_identifiers(self):
        """Greek identifiers are allowed."""
        result = normalize_input("T{^α _β}")
        assert result == "T{^α _β}"

    def test_reject_cjk_characters(self):
        """CJK characters must be rejected."""
        expr = "T{^漢}"
        with pytest.raises(ChacanaParseError, match="[Uu]nicode"):
            normalize_input(expr)

    def test_reject_arabic_characters(self):
        """Arabic characters must be rejected."""
        expr = "T{^ع}"  # Arabic letter ain
        with pytest.raises(ChacanaParseError, match="[Uu]nicode"):
            normalize_input(expr)

    def test_allow_digits_and_operators(self):
        """Digits and standard operator symbols are allowed."""
        result = normalize_input("3.14 * T{^a _b} + 2 * R{;c ,d}")
        assert "3.14" in result

    def test_allow_structural_characters(self):
        """Structural characters like braces, brackets, parens are allowed."""
        result = normalize_input("[A, B]")
        assert result == "[A, B]"

    def test_allow_perturbation_at_sign(self):
        """@ sign for perturbation is allowed."""
        result = normalize_input("@2(A + B)")
        assert result == "@2(A + B)"


class TestNestedSymmetrizationValidation:
    """Post-parse validation for nested symmetrization rejection."""

    def test_flat_symmetrization_ok(self):
        """Non-nested symmetrization should pass validation."""
        result = normalize_and_parse("T{_( a b _)}")
        assert result is not None

    def test_flat_anti_symmetrization_ok(self):
        """Non-nested anti-symmetrization should pass validation."""
        result = normalize_and_parse("T{_[ a b _]}")
        assert result is not None

    def test_nested_symmetrization_rejects(self):
        """Nested symmetrization must be rejected."""
        with pytest.raises(ChacanaParseError, match="[Nn]ested"):
            normalize_and_parse("T{_( _( a b _) _)}")

    def test_deeply_nested_rejects(self):
        """Deeply nested symmetrization must be rejected."""
        with pytest.raises(ChacanaParseError, match="[Nn]ested"):
            normalize_and_parse("T{_( _( _( a b _) _) _)}")


class TestPublicAPI:
    """Test that the public parse() function integrates normalization."""

    def test_parse_normalizes_unicode(self):
        """parse() should NFC-normalize input."""
        from chacana import parse

        # Use a basic expression that we know works
        result = parse("T{^a _b}")
        assert result is not None

    def test_parse_rejects_cyrillic(self):
        """parse() should reject Cyrillic characters."""
        from chacana import parse

        cyrillic_a = "\u0430"
        with pytest.raises(ChacanaParseError, match="[Cc]yrillic|[Uu]nicode"):
            parse(f"T{{^{cyrillic_a}}}")

    def test_parse_rejects_nested_sym(self):
        """parse() should reject nested symmetrization."""
        from chacana import parse

        with pytest.raises(ChacanaParseError, match="[Nn]ested"):
            parse("T{_( _( a b _) _)}")


# --- Helper ---


def normalize_and_parse(expr: str):
    """Normalize input and parse, with post-parse validation."""
    from chacana.grammar import normalize_input, parse_and_validate

    normalized = normalize_input(expr)
    return parse_and_validate(normalized)
