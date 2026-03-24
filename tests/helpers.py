"""Shared test helpers for Chacana tests."""

from chacana.ast import ValidationToken
from chacana.grammar import create_parser
from chacana.visitor import parse_to_ast


def make_token(expr: str) -> ValidationToken:
    """Parse an expression string into a ValidationToken."""
    parser = create_parser()
    tree = parser.parse(expr)
    return parse_to_ast(tree)
