"""Arpeggio parse-tree -> Chacana AST visitor."""

from __future__ import annotations

from typing import Any

from arpeggio import PTNodeVisitor, visit_parse_tree

from chacana.ast import ChacanaIndex, IndexType, ValidationToken, Variance


def _build_index(
    variance_str: str | None,
    name: str,
    is_derivative: bool = False,
    derivative_type: str | None = None,
) -> ChacanaIndex:
    v = Variance.CONTRA if variance_str == "^" else Variance.COVAR
    # Simple heuristic for index type based on alphabet
    _greek_lower = (
        "\u03b1\u03b2\u03b3\u03b4\u03b5\u03b6\u03b7\u03b8\u03b9\u03ba"
        "\u03bb\u03bc\u03bd\u03be\u03bf\u03c0\u03c1\u03c3\u03c4\u03c5"
        "\u03c6\u03c7\u03c8\u03c9"
    )
    it = IndexType.LATIN
    if any(c in _greek_lower for c in name.lower()):
        it = IndexType.GREEK
    return ChacanaIndex(
        label=name,
        variance=v,
        index_type=it,
        is_derivative=is_derivative,
        derivative_type=derivative_type,
    )


class ChacanaVisitor(PTNodeVisitor):
    def visit_expression(self, node: Any, children: Any) -> Any:
        return children[0]

    def visit_sum_expr(self, node: Any, children: Any) -> Any:
        terms = [c for c in children if not (isinstance(c, str) and c in ("+", "-"))]
        if len(terms) == 1:
            return terms[0]
        return ValidationToken(head="Add", args=terms)

    def visit_product_expr(self, node: Any, children: Any) -> Any:
        terms = [c for c in children if not (isinstance(c, str) and c == "*")]
        if len(terms) == 1:
            return terms[0]
        return ValidationToken(head="Multiply", args=terms)

    def visit_wedge_expr(self, node: Any, children: Any) -> Any:
        terms = [c for c in children if not (isinstance(c, str) and c == "^")]
        if len(terms) == 1:
            return terms[0]
        return ValidationToken(head="Wedge", args=terms)

    def visit_factor(self, node: Any, children: Any) -> Any:
        if len(children) > 1 and isinstance(children[0], ValidationToken):
            # functional_op with indices
            token = children[0]
            token.indices = children[1]
            return token
        return children[0]

    def visit_tensor_expr(self, node: Any, children: Any) -> ValidationToken:
        name = children[0]
        indices: list[ChacanaIndex] = []
        if len(children) > 1:
            indices = children[1]
        return ValidationToken(head=name, indices=indices)

    def visit_index_list(self, node: Any, children: Any) -> list[ChacanaIndex]:
        flat_indices: list[ChacanaIndex] = []
        for child in children:
            if isinstance(child, list):
                flat_indices.extend(child)
            elif isinstance(child, ChacanaIndex):
                flat_indices.append(child)
            # ignore trailing variance strings in ( a b _ )
        return flat_indices

    def visit_symmetrization(self, node: Any, children: Any) -> list[ChacanaIndex]:
        # children[0] is variance, children[1] is index_list,
        # optional children[2] is trailing variance
        indices: list[ChacanaIndex] = children[1]
        return indices

    def visit_anti_symmetrization(self, node: Any, children: Any) -> list[ChacanaIndex]:
        return children[1]  # type: ignore[no-any-return]

    def visit_index(self, node: Any, children: Any) -> ChacanaIndex:
        variance_str: str | None = None
        idx_node: Any = None
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
        assert isinstance(idx_node, str)
        return _build_index(variance_str, idx_node)

    def visit_derivative(self, node: Any, children: Any) -> tuple[str, str]:
        return (children[0], children[1])

    def visit_functional_op(self, node: Any, children: Any) -> ValidationToken:
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

    def visit_perturbation(self, node: Any, children: Any) -> ValidationToken:
        order = int(children[0])
        expr = children[1]
        return ValidationToken(head="Perturbation", args=[expr], metadata={"order": order})

    def visit_commutator(self, node: Any, children: Any) -> ValidationToken:
        return ValidationToken(head="Commutator", args=[children[0], children[1]])

    def visit_variance(self, node: Any, children: Any) -> str:
        return node.value  # type: ignore[no-any-return]

    def visit_identifier(self, node: Any, children: Any) -> str:
        return node.value  # type: ignore[no-any-return]

    def visit_scalar(self, node: Any, children: Any) -> ValidationToken:
        val = float(node.value) if "." in node.value else int(node.value)
        return ValidationToken(head="Number", value=float(val))


def parse_to_ast(parse_tree: Any) -> ValidationToken:
    return visit_parse_tree(parse_tree, ChacanaVisitor())  # type: ignore[no-any-return]
