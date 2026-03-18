"""Arpeggio PEG grammar for Chacana tensor expressions."""

from arpeggio import (
    EOF,
    OneOrMore,
    Optional,
    RegExMatch,
    ZeroOrMore,
)
from arpeggio import ParserPython


def expression():
    return sum_expr, EOF


def sum_expr():
    return product_expr, ZeroOrMore(["+", "-"], product_expr)


def product_expr():
    return factor, ZeroOrMore("*", factor)


def factor():
    return [tensor_expr, scalar, ("(", sum_expr, ")")]


def tensor_expr():
    return identifier, Optional("{", index_list, "}")


def index_list():
    return OneOrMore(index)


def index():
    return variance, identifier


def variance():
    return RegExMatch(r"[\^_]")


def identifier():
    return RegExMatch(r"[a-zA-Z\u0370-\u03FF][a-zA-Z0-9\u0370-\u03FF]*")


def scalar():
    return RegExMatch(r"[0-9]+(\.[0-9]+)?")


def create_parser(**kwargs) -> ParserPython:
    return ParserPython(expression, skipws=True, **kwargs)
