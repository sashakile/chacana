"""Tests for TOML context loader."""

import pytest

from chacana.ast import Variance
from chacana.context import load_context
from chacana.errors import ChacanaError


class TestLoadContext:
    def test_minimal(self):
        ctx = load_context("""
[manifold.M]
dimension = 4
index_type = "Latin"

[tensor.R]
manifold = "M"
rank = 4
index_pattern = ["Contra", "Covar", "Covar", "Covar"]
""")
        assert "M" in ctx.manifolds
        assert ctx.manifolds["M"].dimension == 4
        assert "R" in ctx.tensors
        assert ctx.tensors["R"].rank == 4
        assert ctx.tensors["R"].index_pattern == [
            Variance.CONTRA, Variance.COVAR, Variance.COVAR, Variance.COVAR,
        ]

    def test_missing_dimension(self):
        with pytest.raises(ChacanaError, match="missing required 'dimension'"):
            load_context("""
[manifold.M]
index_type = "Latin"
""")

    def test_multiple_tensors(self):
        ctx = load_context("""
[manifold.M]
dimension = 4

[tensor.A]
manifold = "M"
rank = 1
index_pattern = ["Contra"]

[tensor.B]
manifold = "M"
rank = 1
index_pattern = ["Contra"]
""")
        assert len(ctx.tensors) == 2
        assert "A" in ctx.tensors
        assert "B" in ctx.tensors

    def test_load_from_file(self, tmp_path):
        toml_file = tmp_path / "test.toml"
        toml_file.write_text("""
[manifold.M]
dimension = 3

[tensor.T]
manifold = "M"
rank = 2
index_pattern = ["Contra", "Covar"]
""")
        ctx = load_context(str(toml_file))
        assert ctx.manifolds["M"].dimension == 3
