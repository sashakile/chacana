"""AST node types for Chacana expressions (MathJSON ValidationToken format)."""

from __future__ import annotations

from collections.abc import Iterator
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class Variance(Enum):
    CONTRA = "Contra"
    COVAR = "Covar"


class IndexType(Enum):
    LATIN = "Latin"
    GREEK = "Greek"
    SPINOR = "Spinor"


# Canonical head strings — use these instead of raw string literals.
HEAD_ADD = "Add"
HEAD_NEGATE = "Negate"
HEAD_MULTIPLY = "Multiply"
HEAD_WEDGE = "Wedge"
HEAD_NUMBER = "Number"
HEAD_EXTERIOR_DERIVATIVE = "ExteriorDerivative"
HEAD_LIE_DERIVATIVE = "LieDerivative"
HEAD_TRACE = "Trace"
HEAD_DETERMINANT = "Determinant"
HEAD_INVERSE = "Inverse"
HEAD_HODGE_STAR = "HodgeStar"
HEAD_INTERIOR_PRODUCT = "InteriorProduct"
HEAD_PERTURBATION = "Perturbation"
HEAD_COMMUTATOR = "Commutator"
HEAD_DIVIDE = "Divide"
HEAD_RATIONAL = "Rational"


@dataclass(frozen=True)
class ChacanaIndex:
    label: str
    variance: Variance
    index_type: IndexType = IndexType.LATIN
    is_derivative: bool = False
    derivative_type: str | None = None  # "Semicolon" or "Comma"

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {
            "label": self.label,
            "variance": self.variance.value,
            "type": self.index_type.value,
        }
        if self.is_derivative:
            result["is_derivative"] = True
            result["derivative_type"] = self.derivative_type
        return result


@dataclass
class TokenMetadata:
    symmetrized_groups: list[list[int]] = field(default_factory=list)
    antisymmetrized_groups: list[list[int]] = field(default_factory=list)
    order: int | None = None


@dataclass
class ValidationToken:
    head: str
    indices: list[ChacanaIndex] = field(default_factory=list)
    args: list[ValidationToken] = field(default_factory=list)
    value: float | None = None
    metadata: TokenMetadata = field(default_factory=TokenMetadata)

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {"type": "TensorExpression", "head": self.head}
        if self.indices:
            result["indices"] = [idx.to_dict() for idx in self.indices]
        if self.args:
            result["args"] = [arg.to_dict() for arg in self.args]
        if self.value is not None:
            result["value"] = self.value
        meta: dict[str, Any] = {}
        if self.metadata.symmetrized_groups:
            meta["symmetrized_groups"] = self.metadata.symmetrized_groups
        if self.metadata.antisymmetrized_groups:
            meta["antisymmetrized_groups"] = self.metadata.antisymmetrized_groups
        if self.metadata.order is not None:
            meta["order"] = self.metadata.order
        if meta:
            result["metadata"] = meta
        return result


def walk_tokens(token: ValidationToken) -> Iterator[ValidationToken]:
    """Pre-order traversal of a token tree."""
    yield token
    for arg in token.args:
        yield from walk_tokens(arg)
