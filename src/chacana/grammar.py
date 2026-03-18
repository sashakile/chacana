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
    return wedge_expr, ZeroOrMore("*", wedge_expr)


def wedge_expr():
    return factor, ZeroOrMore("^", factor)


def factor():
    return [
        (functional_op, Optional("{", index_list, "}")),
        tensor_expr,
        scalar,
        perturbation,
        commutator,
        ("(", sum_expr, ")"),
    ]


def tensor_expr():
    return identifier, Optional("{", index_list, "}")


def index_list():
    return OneOrMore([symmetrization, anti_symmetrization, index])


def symmetrization():
    return (
        variance,
        "(",
        index_list,
        Optional(variance),
        ")",
    )


def anti_symmetrization():
    return (
        variance,
        "[",
        index_list,
        Optional(variance),
        "]",
    )


def index():
    return Optional(variance), [derivative, identifier]


def derivative():
    return [";", ","], identifier


def variance():
    return RegExMatch(r"[\^_]")


def functional_op():
    return identifier, "(", Optional(sum_expr, ZeroOrMore(",", sum_expr)), ")"


def perturbation():
    return "@", RegExMatch(r"[0-9]+"), "(", sum_expr, ")"


def commutator():
    return "[", sum_expr, ",", sum_expr, "]"


def identifier():
    return RegExMatch(r"[a-zA-Z\u0370-\u03FF][a-zA-Z0-9\u0370-\u03FF]*")


def scalar():
    return RegExMatch(r"[0-9]+(\.[0-9]+)?")


def create_parser(**kwargs) -> ParserPython:
    return ParserPython(expression, skipws=True, **kwargs)
