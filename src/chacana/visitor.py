"""Arpeggio parse-tree → Chacana AST visitor."""

from __future__ import annotations

from arpeggio import PTNodeVisitor, visit_parse_tree

from chacana.ast import ChacanaIndex, ValidationToken, Variance


def _build_index(variance_str: str, name: str) -> ChacanaIndex:
    v = Variance.CONTRA if variance_str == "^" else Variance.COVAR
    return ChacanaIndex(name=name, variance=v)


class ChacanaVisitor(PTNodeVisitor):

    def visit_expression(self, node, children):
        return children[0]

    def visit_sum_expr(self, node, children):
        terms = []
        for child in children:
            if isinstance(child, str) and child in ("+", "-"):
                continue
            terms.append(child)
        if len(terms) == 1:
            return terms[0]
        return ValidationToken(head="Add", args=terms)

    def visit_product_expr(self, node, children):
        terms = [c for c in children if not (isinstance(c, str) and c == "*")]
        if len(terms) == 1:
            return terms[0]
        return ValidationToken(head="Multiply", args=terms)

    def visit_factor(self, node, children):
        return children[0]

    def visit_tensor_expr(self, node, children):
        name = None
        indices = []
        for child in children:
            if isinstance(child, str):
                name = child
            elif isinstance(child, list):
                indices = child
        return ValidationToken(head=name, indices=indices)

    def visit_index_list(self, node, children):
        return list(children)

    def visit_index(self, node, children):
        if len(children) == 2 and isinstance(children[0], str) and isinstance(children[1], str):
            return _build_index(children[0], children[1])
        return children[0]

    def visit_variance(self, node, children):
        return node.value

    def visit_identifier(self, node, children):
        return node.value

    def visit_scalar(self, node, children):
        val = float(node.value) if "." in node.value else int(node.value)
        return ValidationToken(head="Number", value=float(val))


def parse_to_ast(parse_tree) -> ValidationToken:
    return visit_parse_tree(parse_tree, ChacanaVisitor())
