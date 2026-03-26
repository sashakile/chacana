"""Chacana -- a tensor calculus DSL with static type checking."""

from __future__ import annotations

from typing import Any

from chacana.checker import check
from chacana.context import GlobalContext, load_context, load_context_file, load_context_string
from chacana.errors import ChacanaParseError, ChacanaTypeError
from chacana.grammar import normalize_input, parse_and_validate
from chacana.visitor import parse_to_ast

__version__ = "0.1.0"

__all__ = [
    "parse",
    "check",
    "load_context",
    "load_context_file",
    "load_context_string",
    "GlobalContext",
    "ChacanaParseError",
    "ChacanaTypeError",
]


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

    token = parse_to_ast(tree)
    check(token, context)
    return token.to_dict()
