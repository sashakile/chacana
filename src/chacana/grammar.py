"""Arpeggio PEG grammar for Chacana tensor expressions."""

from __future__ import annotations

import re
import unicodedata
from typing import Any

from arpeggio import (
    EOF,
    OneOrMore,
    Optional,
    ParserPython,
    RegExMatch,
    ZeroOrMore,
)

from chacana.errors import ChacanaParseError

# Characters allowed in identifiers beyond ASCII and standard operators.
# Latin letters, digits, Greek block (U+0370-03FF), and combining diacritical
# marks (U+0300-036F) are accepted. Everything else that is a letter/mark
# outside these ranges is rejected.
_DISALLOWED_UNICODE_RE = re.compile(
    r"[\u0400-\u04FF"  # Cyrillic
    r"\u0500-\u052F"  # Cyrillic Supplement
    r"\u0600-\u06FF"  # Arabic
    r"\u0980-\u09FF"  # Bengali
    r"\u0A00-\u0A7F"  # Gurmukhi
    r"\u3000-\u9FFF"  # CJK
    r"\uAC00-\uD7AF"  # Hangul
    r"\U00010000-\U0001FFFF"  # SMP (emoji, historic scripts, etc.)
    r"]"
)

# More precise: after NFC normalization, every "letter-like" character in
# the input must be Latin (A-Z, a-z), Greek (U+0370-03FF), a combining
# mark (U+0300-036F), or a digit.  This allowlist approach is safer than
# a blocklist.
_ALLOWED_LETTER_RE = re.compile(
    r"^[a-zA-Z0-9"
    r"\u00C0-\u024F"  # Latin Extended (Latin-1 Supplement + Extended-A + Extended-B)
    r"\u0300-\u036F"  # combining diacritical marks
    r"\u0370-\u03FF"  # Greek and Coptic
    r"\u1E00-\u1EFF"  # Latin Extended Additional (precomposed with diacritics)
    r"\s"  # whitespace
    r"\+\-\*/\^"  # arithmetic operators
    r"\{\}\[\]\(\)"  # brackets
    r"_"  # covariant marker
    r";,\.@"  # derivative, comma, dot, perturbation
    r"]*$"
)


def normalize_input(expr: str) -> str:
    """Apply Unicode NFC normalization and reject out-of-scope characters.

    This function MUST be called before parsing to prevent visual spoofing
    and ensure canonical representation of characters.

    Raises:
        ChacanaParseError: if the expression contains characters from
            disallowed Unicode blocks (e.g., Cyrillic, Arabic, CJK).
    """
    # Step 1: NFC normalization
    normalized = unicodedata.normalize("NFC", expr)

    # Step 2: Reject disallowed Unicode blocks (fast blocklist check)
    match = _DISALLOWED_UNICODE_RE.search(normalized)
    if match:
        char = match.group()
        codepoint = ord(char)
        try:
            name = unicodedata.name(char)
        except ValueError:
            name = "UNKNOWN"
        if 0x0400 <= codepoint <= 0x052F:
            block = "Cyrillic"
        elif 0x0600 <= codepoint <= 0x06FF:
            block = "Arabic"
        elif 0x3000 <= codepoint <= 0x9FFF:
            block = "CJK"
        else:
            block = "disallowed"
        raise ChacanaParseError(
            f"Unicode character U+{codepoint:04X} ({name}) from {block} "
            f"block is not allowed. Only Latin and Greek characters are "
            f"permitted in Chacana expressions."
        )

    # Step 3: Allowlist check for any remaining exotic characters
    if not _ALLOWED_LETTER_RE.match(normalized):
        # Find the offending character
        for i, ch in enumerate(normalized):
            if not re.match(
                r"[a-zA-Z0-9\u00C0-\u024F\u0300-\u036F\u0370-\u03FF"
                r"\u1E00-\u1EFF\s"
                r"\+\-\*/\^\{\}\[\]\(\)_;,\.@]",
                ch,
            ):
                codepoint = ord(ch)
                try:
                    name = unicodedata.name(ch)
                except ValueError:
                    name = "UNKNOWN"
                raise ChacanaParseError(
                    f"Unicode character U+{codepoint:04X} ({name}) at "
                    f"position {i} is not allowed. Only Latin and Greek "
                    f"characters are permitted in Chacana expressions."
                )

    return normalized


def _has_nested_symmetrization(node: Any, depth: int = 0) -> bool:
    """Walk the parse tree to detect nested symmetrization/anti-symmetrization.

    Returns True if any symmetrization or anti-symmetrization node contains
    another symmetrization or anti-symmetrization node as a descendant.
    """
    rule_name = getattr(node, "rule_name", "")

    is_sym = rule_name in ("symmetrization", "anti_symmetrization")
    if is_sym and depth > 0:
        return True

    new_depth = depth + 1 if is_sym else depth

    # Recurse into children
    if hasattr(node, "__iter__") and not isinstance(node, str):
        for child in node:
            if _has_nested_symmetrization(child, new_depth):
                return True

    return False


def _reject_nested_symmetrization(parse_tree: Any) -> None:
    """Post-parse validation: reject nested symmetrization.

    Raises:
        ChacanaParseError: if nested symmetrization or anti-symmetrization
            is detected in the parse tree.
    """
    if _has_nested_symmetrization(parse_tree):
        raise ChacanaParseError(
            "Nested symmetrization/anti-symmetrization is not supported in Chacana expressions."
        )


def parse_and_validate(expr: str) -> Any:
    """Parse an expression string and apply post-parse validations.

    This function creates a parser, parses the (already normalized) input,
    and runs post-parse checks such as nested symmetrization rejection.

    Args:
        expr: The expression string (should already be NFC-normalized).

    Returns:
        The Arpeggio parse tree.

    Raises:
        ChacanaParseError: on parse failure or validation failure.
        arpeggio.NoMatch: on grammar mismatch (re-raised as-is for
            callers that catch it directly).
    """
    parser = create_parser()
    tree = parser.parse(expr)
    _reject_nested_symmetrization(tree)
    return tree


# --- PEG Grammar Rules ---


def expression() -> Any:
    return sum_expr, EOF


def sum_expr() -> Any:
    return product_expr, ZeroOrMore(["+", "-"], product_expr)


def product_expr() -> Any:
    return wedge_expr, ZeroOrMore("*", wedge_expr)


def wedge_expr() -> Any:
    return factor, ZeroOrMore("^", factor)


def factor() -> Any:
    return [
        (functional_op, Optional("{", index_list, "}")),
        tensor_expr,
        scalar,
        perturbation,
        commutator,
        ("(", sum_expr, ")"),
    ]


def tensor_expr() -> Any:
    return identifier, Optional("{", index_list, "}")


def index_list() -> Any:
    return OneOrMore([symmetrization, anti_symmetrization, index])


def symmetrization() -> Any:
    return (
        variance,
        "(",
        index_list,
        Optional(variance),
        ")",
    )


def anti_symmetrization() -> Any:
    return (
        variance,
        "[",
        index_list,
        Optional(variance),
        "]",
    )


def index() -> Any:
    return Optional(variance), [derivative, identifier]


def derivative() -> Any:
    return [";", ","], identifier


def variance() -> Any:
    return RegExMatch(r"[\^_]")


def functional_op() -> Any:
    return identifier, "(", Optional(sum_expr, ZeroOrMore(",", sum_expr)), ")"


def perturbation() -> Any:
    return "@", RegExMatch(r"[0-9]+"), "(", sum_expr, ")"


def commutator() -> Any:
    return "[", sum_expr, ",", sum_expr, "]"


def identifier() -> Any:
    return RegExMatch(r"[a-zA-Z\u0370-\u03FF][a-zA-Z0-9\u0370-\u03FF]*")


def scalar() -> Any:
    return RegExMatch(r"[0-9]+(\.[0-9]+)?")


def create_parser(**kwargs: Any) -> ParserPython:
    return ParserPython(expression, skipws=True, **kwargs)
