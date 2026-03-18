"""Arpeggio parse-tree → Chacana AST visitor."""

from __future__ import annotations

from arpeggio import PTNodeVisitor, visit_parse_tree

from chacana.ast import ChacanaIndex, IndexType, ValidationToken, Variance


def _build_index(
    variance_str: str | None,
    name: str,
    is_derivative: bool = False,
    derivative_type: str | None = None,
) -> ChacanaIndex:
    v = Variance.CONTRA if variance_str == "^" else Variance.COVAR
    # Simple heuristic for index type based on alphabet for reference implementation
    it = IndexType.LATIN
    if any(c in "αβγδεζηθικλμνξοπρστυφχψω" for c in name.lower()):
        it = IndexType.GREEK
    return ChacanaIndex(
        label=name,
        variance=v,
        index_type=it,
        is_derivative=is_derivative,
        derivative_type=derivative_type,
    )


class ChacanaVisitor(PTNodeVisitor):

    def visit_expression(self, node, children):
        return children[0]

    def visit_sum_expr(self, node, children):
        terms = [c for c in children if not (isinstance(c, str) and c in ("+", "-"))]
        if len(terms) == 1:
            return terms[0]
        return ValidationToken(head="Add", args=terms)

    def visit_product_expr(self, node, children):
        terms = [c for c in children if not (isinstance(c, str) and c == "*")]
        if len(terms) == 1:
            return terms[0]
        return ValidationToken(head="Multiply", args=terms)

    def visit_wedge_expr(self, node, children):
        terms = [c for c in children if not (isinstance(c, str) and c == "^")]
        if len(terms) == 1:
            return terms[0]
        return ValidationToken(head="Wedge", args=terms)

    def visit_factor(self, node, children):
        if len(children) > 1 and isinstance(children[0], ValidationToken):
            # functional_op with indices
            token = children[0]
            token.indices = children[1]
            return token
        return children[0]

    def visit_tensor_expr(self, node, children):
        name = children[0]
        indices = []
        if len(children) > 1:
            indices = children[1]
        return ValidationToken(head=name, indices=indices)

    def visit_index_list(self, node, children):
        flat_indices = []
        for child in children:
            if isinstance(child, list):
                flat_indices.extend(child)
            elif isinstance(child, ChacanaIndex):
                flat_indices.append(child)
            # ignore trailing variance strings in ( a b _ )
        return flat_indices

    def visit_symmetrization(self, node, children):
        # children[0] is variance, children[1] is index_list, optional children[2] is trailing variance
        indices = children[1]
        return indices

    def visit_anti_symmetrization(self, node, children):
        return children[1]

    def visit_index(self, node, children):
        variance_str = None
        idx_node = None
        for child in children:
            if isinstance(child, str) and child in ("^", "_"):
                variance_str = child
            else:
                idx_node = child

        if isinstance(idx_node, tuple):  # derivative
            dtype, name = idx_node
            is_deriv = True
            deriv_type = "Semicolon" if dtype == ";" else "Comma"
            return _build_index(variance_str, name, is_deriv, deriv_type)
        else:
            return _build_index(variance_str, idx_node)

    def visit_derivative(self, node, children):
        return (children[0], children[1])

    def visit_functional_op(self, node, children):
        head = children[0]
        args = children[1:]
        # Map some common ones to canonical names if needed
        head_map = {
            "d": "ExteriorDerivative",
            "L": "LieDerivative",
            "Tr": "Trace",
            "det": "Determinant",
            "inv": "Inverse",
            "star": "HodgeStar",
            "hodge": "HodgeStar",
            "i": "InteriorProduct",
        }
        return ValidationToken(head=head_map.get(head, head), args=list(args))

    def visit_perturbation(self, node, children):
        order = int(children[0])
        expr = children[1]
        return ValidationToken(
            head="Perturbation", args=[expr], metadata={"order": order}
        )

    def visit_commutator(self, node, children):
        return ValidationToken(head="Commutator", args=[children[0], children[1]])

    def visit_variance(self, node, children):
        return node.value

    def visit_identifier(self, node, children):
        return node.value

    def visit_scalar(self, node, children):
        val = float(node.value) if "." in node.value else int(node.value)
        return ValidationToken(head="Number", value=float(val))


def parse_to_ast(parse_tree) -> ValidationToken:
    return visit_parse_tree(parse_tree, ChacanaVisitor())
