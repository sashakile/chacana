"""AST node types for Chacana expressions (MathJSON ValidationToken format)."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Union


class Variance(Enum):
    CONTRA = "Contra"
    COVAR = "Covar"


@dataclass(frozen=True)
class ChacanaIndex:
    name: str
    variance: Variance

    def to_dict(self) -> dict:
        return {"name": self.name, "variance": self.variance.value}


@dataclass
class ValidationToken:
    head: str
    indices: list[ChacanaIndex] = field(default_factory=list)
    args: list[ValidationToken] = field(default_factory=list)
    value: float | None = None

    def to_dict(self) -> dict:
        result: dict = {"head": self.head}
        if self.indices:
            result["indices"] = [idx.to_dict() for idx in self.indices]
        if self.args:
            result["args"] = [arg.to_dict() for arg in self.args]
        if self.value is not None:
            result["value"] = self.value
        return result
