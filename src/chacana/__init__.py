"""Chacana -- a tensor calculus DSL with static type checking."""

from __future__ import annotations

from typing import Any

from chacana.ast import ValidationToken
from chacana.checker import check as _checker_check
from chacana.context import GlobalContext, load_context, load_context_file, load_context_string
from chacana.errors import ChacanaParseError, ChacanaTypeError
from chacana.grammar import normalize_input, parse_and_validate
from chacana.latex import from_latex, to_latex
from chacana.visitor import parse_to_ast

_DEEP_NESTING_MSG = (
    "Expression too deeply nested: reduce the nesting depth "
    "of parentheses or operators and try again."
)

__version__ = "0.1.0"

__all__ = [
    "parse",
    "check",
    "to_latex",
    "from_latex",
    "load_context",
    "load_context_file",
    "load_context_string",
    "GlobalContext",
    "ChacanaParseError",
    "ChacanaTypeError",
]


def check(token: ValidationToken, ctx: GlobalContext | None = None) -> ValidationToken:
    """Run all type checks on a ValidationToken. Returns the token if valid.

    This is a safe wrapper around the low-level checker that catches
    RecursionError and surfaces it as a ChacanaParseError.
    """
    try:
        return _checker_check(token, ctx)
    except RecursionError as e:
        raise ChacanaParseError(_DEEP_NESTING_MSG) from e


def parse(expr: str, *, context: GlobalContext | None = None) -> dict[str, Any]:
    """Parse a tensor expression and optionally type-check it.

    Applies Unicode NFC normalization and rejects out-of-scope characters
    before parsing. Also rejects nested symmetrization after parsing.

    Returns a MathJSON-style dict (ValidationToken.to_dict()).
    """
    from arpeggio import NoMatch

    expr = normalize_input(expr)
    try:
        tree = parse_and_validate(expr)
    except NoMatch as e:
        raise ChacanaParseError(str(e)) from e
    except RecursionError as e:
        raise ChacanaParseError(_DEEP_NESTING_MSG) from e

    try:
        token = parse_to_ast(tree)
        check(token, context)
    except RecursionError as e:
        raise ChacanaParseError(_DEEP_NESTING_MSG) from e

    return token.to_dict()
