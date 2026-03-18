"""AST node types for Chacana expressions (MathJSON ValidationToken format)."""

from __future__ import annotations

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
class ValidationToken:
    head: str
    indices: list[ChacanaIndex] = field(default_factory=list)
    args: list[ValidationToken] = field(default_factory=list)
    value: float | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {"type": "TensorExpression", "head": self.head}
        if self.indices:
            result["indices"] = [idx.to_dict() for idx in self.indices]
        if self.args:
            result["args"] = [arg.to_dict() for arg in self.args]
        if self.value is not None:
            result["value"] = self.value
        if self.metadata:
            result["metadata"] = self.metadata
        return result
