"""Shared fixtures for Chacana tests."""

import pytest

from chacana.context import GlobalContext, ManifoldDecl, TensorDecl, load_context
from chacana.ast import Variance


@pytest.fixture
def basic_context() -> GlobalContext:
    """A minimal context with manifold M, tensors R, T, A, B."""
    return load_context("""
[manifold.M]
dimension = 4
index_type = "Latin"

[tensor.R]
manifold = "M"
rank = 4
index_pattern = ["Contra", "Covar", "Covar", "Covar"]

[tensor.T]
manifold = "M"
rank = 2
index_pattern = ["Contra", "Covar"]

[tensor.A]
manifold = "M"
rank = 1
index_pattern = ["Contra"]

[tensor.B]
manifold = "M"
rank = 1
index_pattern = ["Contra"]
""")


@pytest.fixture
def contraction_context() -> GlobalContext:
    """Context with tensors suitable for contraction tests."""
    return load_context("""
[manifold.M]
dimension = 4

[tensor.A]
manifold = "M"
rank = 1
index_pattern = ["Covar"]

[tensor.B]
manifold = "M"
rank = 1
index_pattern = ["Contra"]
""")
