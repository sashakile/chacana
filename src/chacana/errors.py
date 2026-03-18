"""Chacana error types."""


class ChacanaError(Exception):
    """Base error for all Chacana errors."""


class ChacanaParseError(ChacanaError):
    """Raised when the input expression cannot be parsed."""


class ChacanaTypeError(ChacanaError):
    """Raised when type checking fails (index mismatch, rank error, etc.)."""
