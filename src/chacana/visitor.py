"""Arpeggio parse-tree -> Chacana AST visitor."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from arpeggio import PTNodeVisitor, visit_parse_tree

from chacana.ast import (
    HEAD_ADD,
    HEAD_COMMUTATOR,
    HEAD_DETERMINANT,
    HEAD_EXTERIOR_DERIVATIVE,
    HEAD_HODGE_STAR,
    HEAD_INTERIOR_PRODUCT,
    HEAD_INVERSE,
    HEAD_LIE_DERIVATIVE,
    HEAD_MULTIPLY,
    HEAD_NEGATE,
    HEAD_NUMBER,
    HEAD_PERTURBATION,
    HEAD_TRACE,
    HEAD_WEDGE,
    ChacanaIndex,
    IndexType,
    ValidationToken,
    Variance,
)


@dataclass
class _SymGroup:
    """Marker returned by symmetrization visitors to preserve group info."""

    indices: list[ChacanaIndex]
    kind: str  # "sym" or "antisym"


def _build_index(
    variance_str: str | None,
    name: str,
    is_derivative: bool = False,
    derivative_type: str | None = None,
) -> ChacanaIndex:
    # When variance is omitted, default to covariant (spec: variance is optional).
    v = Variance.CONTRA if variance_str == "^" else Variance.COVAR
    # Heuristic for index type based on alphabet
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
        # Collect terms and operators, wrapping subtracted terms in Negate.
        terms: list[Any] = []
        pending_negate = False
        for child in children:
            if isinstance(child, str) and child == "+":
                pending_negate = False
            elif isinstance(child, str) and child == "-":
                pending_negate = True
            else:
                if pending_negate:
                    child = ValidationToken(head=HEAD_NEGATE, args=[child])
                    pending_negate = False
                terms.append(child)
        if len(terms) == 1:
            return terms[0]
        return ValidationToken(head=HEAD_ADD, args=terms)

    def visit_product_expr(self, node: Any, children: Any) -> Any:
        terms = [c for c in children if not (isinstance(c, str) and c == "*")]
        if len(terms) == 1:
            return terms[0]
        return ValidationToken(head=HEAD_MULTIPLY, args=terms)

    def visit_wedge_expr(self, node: Any, children: Any) -> Any:
        terms = [c for c in children if not (isinstance(c, str) and c == "^")]
        if len(terms) == 1:
            return terms[0]
        return ValidationToken(head=HEAD_WEDGE, args=terms)

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
        metadata: dict[str, Any] = {}
        if len(children) > 1:
            raw = children[1]
            if isinstance(raw, tuple):
                indices, metadata = raw
            else:
                indices = raw
        return ValidationToken(head=name, indices=indices, metadata=metadata)

    def visit_index_list(
        self, node: Any, children: Any
    ) -> tuple[list[ChacanaIndex], dict[str, Any]] | list[ChacanaIndex]:
        flat_indices: list[ChacanaIndex] = []
        sym_groups: list[list[int]] = []
        antisym_groups: list[list[int]] = []

        for child in children:
            if isinstance(child, _SymGroup):
                start = len(flat_indices)
                positions = list(range(start, start + len(child.indices)))
                flat_indices.extend(child.indices)
                if child.kind == "sym":
                    sym_groups.append(positions)
                else:
                    antisym_groups.append(positions)
            elif isinstance(child, list):
                flat_indices.extend(child)
            elif isinstance(child, ChacanaIndex):
                flat_indices.append(child)
            # ignore trailing variance strings in ( a b _ )

        if sym_groups or antisym_groups:
            meta: dict[str, Any] = {}
            if sym_groups:
                meta["symmetrized_groups"] = sym_groups
            if antisym_groups:
                meta["antisymmetrized_groups"] = antisym_groups
            return (flat_indices, meta)
        return flat_indices

    def visit_symmetrization(self, node: Any, children: Any) -> _SymGroup:
        indices: list[ChacanaIndex] = children[1]
        return _SymGroup(indices=indices, kind="sym")

    def visit_anti_symmetrization(self, node: Any, children: Any) -> _SymGroup:
        return _SymGroup(indices=children[1], kind="antisym")

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
        head_map = {
            "d": HEAD_EXTERIOR_DERIVATIVE,
            "L": HEAD_LIE_DERIVATIVE,
            "Tr": HEAD_TRACE,
            "det": HEAD_DETERMINANT,
            "inv": HEAD_INVERSE,
            "star": HEAD_HODGE_STAR,
            "hodge": HEAD_HODGE_STAR,
            "i": HEAD_INTERIOR_PRODUCT,
        }
        return ValidationToken(head=head_map.get(head, head), args=list(args))

    def visit_perturbation(self, node: Any, children: Any) -> ValidationToken:
        order = int(children[0])
        expr = children[1]
        return ValidationToken(head=HEAD_PERTURBATION, args=[expr], metadata={"order": order})

    def visit_commutator(self, node: Any, children: Any) -> ValidationToken:
        return ValidationToken(head=HEAD_COMMUTATOR, args=[children[0], children[1]])

    def visit_variance(self, node: Any, children: Any) -> str:
        return node.value  # type: ignore[no-any-return]

    def visit_identifier(self, node: Any, children: Any) -> str:
        return node.value  # type: ignore[no-any-return]

    def visit_scalar(self, node: Any, children: Any) -> ValidationToken:
        val = float(node.value) if "." in node.value else int(node.value)
        return ValidationToken(head=HEAD_NUMBER, value=float(val))


def parse_to_ast(parse_tree: Any) -> ValidationToken:
    return visit_parse_tree(parse_tree, ChacanaVisitor())  # type: ignore[no-any-return]
