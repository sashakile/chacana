"""Shared fixtures for Chacana tests."""

import pytest

from chacana.context import GlobalContext, load_context


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


@pytest.fixture
def metric_context() -> GlobalContext:
    """Context with active_metric enabled."""
    return load_context("""
[strategy]
active_metric = "g"

[manifold.M]
dimension = 4

[tensor.A]
manifold = "M"
rank = 1
index_pattern = ["Covar"]

[tensor.g]
manifold = "M"
rank = 2
index_pattern = ["Covar", "Covar"]
""")


@pytest.fixture
def symmetric_context() -> GlobalContext:
    """Context with a tensor declared symmetric in indices [1, 2]."""
    return load_context("""
[manifold.M]
dimension = 4

[tensor.T]
manifold = "M"
rank = 2
index_pattern = ["Covar", "Covar"]
symmetries = [{indices = [1, 2], type = "Symmetric"}]
""")


@pytest.fixture
def diffgeom_context() -> GlobalContext:
    """Manifold M with vector X, 1-form omega, scalar f, metric g, mixed T."""
    return load_context("""
[strategy]
active_metric = "g"

[manifold.M]
dimension = 4

[tensor.X]
manifold = "M"
rank = 1
index_pattern = ["Contra"]

[tensor.omega]
manifold = "M"
rank = 1
index_pattern = ["Covar"]

[tensor.f]
manifold = "M"
rank = 0

[tensor.g]
manifold = "M"
rank = 2
index_pattern = ["Covar", "Covar"]

[tensor.T]
manifold = "M"
rank = 2
index_pattern = ["Contra", "Covar"]

[tensor.S]
manifold = "M"
rank = 3
index_pattern = ["Covar", "Covar", "Covar"]

[tensor.A]
manifold = "M"
rank = 1
index_pattern = ["Covar"]

[tensor.B]
manifold = "M"
rank = 1
index_pattern = ["Covar"]
""")


@pytest.fixture
def no_metric_context() -> GlobalContext:
    """Same tensors but WITHOUT active_metric."""
    return load_context("""
[manifold.M]
dimension = 4

[tensor.X]
manifold = "M"
rank = 1
index_pattern = ["Contra"]

[tensor.omega]
manifold = "M"
rank = 1
index_pattern = ["Covar"]

[tensor.f]
manifold = "M"
rank = 0

[tensor.g]
manifold = "M"
rank = 2
index_pattern = ["Covar", "Covar"]

[tensor.T]
manifold = "M"
rank = 2
index_pattern = ["Contra", "Covar"]

[tensor.S]
manifold = "M"
rank = 3
index_pattern = ["Covar", "Covar", "Covar"]
""")
