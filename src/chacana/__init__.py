"""Chacana — a tensor calculus DSL with static type checking."""

from __future__ import annotations

from pathlib import Path

from chacana.checker import check
from chacana.context import GlobalContext, load_context
from chacana.errors import ChacanaParseError, ChacanaTypeError
from chacana.grammar import create_parser
from chacana.visitor import parse_to_ast

__version__ = "0.1.0"

__all__ = [
    "parse",
    "check",
    "load_context",
    "GlobalContext",
    "ChacanaParseError",
    "ChacanaTypeError",
]


def parse(
    expr: str, *, context: GlobalContext | None = None
) -> dict:
    """Parse a tensor expression and optionally type-check it.

    Returns a MathJSON-style dict (ValidationToken.to_dict()).
    """
    from arpeggio import NoMatch

    parser = create_parser()
    try:
        tree = parser.parse(expr)
    except NoMatch as e:
        raise ChacanaParseError(str(e)) from e

    token = parse_to_ast(tree)
    if context is not None:
        check(token, context)
    return token.to_dict()
