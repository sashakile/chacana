"""Tests for TOML context loader."""

import pytest

from chacana.ast import Variance
from chacana.context import (
    load_context,
)
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
            Variance.CONTRA,
            Variance.COVAR,
            Variance.COVAR,
            Variance.COVAR,
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

    def test_empty_context(self):
        """An empty TOML string yields an empty GlobalContext."""
        ctx = load_context("")
        assert ctx.manifolds == {}
        assert ctx.tensors == {}
        assert ctx.active_metric is None

    def test_manifolds_only(self):
        """Context with only manifolds, no tensors."""
        ctx = load_context("""
[manifold.M]
dimension = 4

[manifold.N]
dimension = 3
index_type = "Greek"
""")
        assert len(ctx.manifolds) == 2
        assert ctx.manifolds["M"].index_type == "Latin"
        assert ctx.manifolds["N"].index_type == "Greek"
        assert ctx.tensors == {}


class TestValidation:
    """Test cross-referential validation in load_context."""

    def test_tensor_references_nonexistent_manifold(self):
        with pytest.raises(ChacanaError, match="references unknown manifold"):
            load_context("""
[manifold.M]
dimension = 4

[tensor.T]
manifold = "N"
rank = 2
index_pattern = ["Contra", "Covar"]
""")

    def test_index_pattern_length_mismatch(self):
        with pytest.raises(ChacanaError, match="index_pattern length"):
            load_context("""
[manifold.M]
dimension = 4

[tensor.T]
manifold = "M"
rank = 3
index_pattern = ["Contra", "Covar"]
""")

    def test_index_pattern_empty_with_nonzero_rank(self):
        """Empty index_pattern is allowed (defaults to empty list)."""
        ctx = load_context("""
[manifold.M]
dimension = 4

[tensor.T]
manifold = "M"
rank = 0
""")
        assert ctx.tensors["T"].rank == 0
        assert ctx.tensors["T"].index_pattern == []

    def test_invalid_index_type(self):
        with pytest.raises(ChacanaError, match="Invalid index_type"):
            load_context("""
[manifold.M]
dimension = 4
index_type = "Klingon"
""")

    def test_valid_index_types(self):
        """Latin, Greek, and Spinor are all valid index_type values."""
        ctx = load_context("""
[manifold.M]
dimension = 4
index_type = "Latin"

[manifold.N]
dimension = 4
index_type = "Greek"

[manifold.P]
dimension = 2
index_type = "Spinor"
""")
        assert ctx.manifolds["M"].index_type == "Latin"
        assert ctx.manifolds["N"].index_type == "Greek"
        assert ctx.manifolds["P"].index_type == "Spinor"

    def test_symmetry_indices_out_of_range(self):
        with pytest.raises(ChacanaError, match="symmetry.*out of range"):
            load_context("""
[manifold.M]
dimension = 4

[tensor.T]
manifold = "M"
rank = 2
index_pattern = ["Contra", "Covar"]
symmetries = [{indices = [1, 5], type = "Symmetric"}]
""")

    def test_symmetry_indices_zero_is_out_of_range(self):
        """Symmetry indices are 1-based, so 0 is invalid."""
        with pytest.raises(ChacanaError, match="symmetry.*out of range"):
            load_context("""
[manifold.M]
dimension = 4

[tensor.T]
manifold = "M"
rank = 2
index_pattern = ["Contra", "Covar"]
symmetries = [{indices = [0, 1], type = "Symmetric"}]
""")

    def test_valid_symmetry(self):
        ctx = load_context("""
[manifold.M]
dimension = 4

[tensor.T]
manifold = "M"
rank = 3
index_pattern = ["Covar", "Covar", "Covar"]
symmetries = [{indices = [1, 2], type = "Symmetric"}]
""")
        assert len(ctx.tensors["T"].symmetries) == 1
        assert ctx.tensors["T"].symmetries[0].type == "Symmetric"

    def test_active_metric_references_nonexistent_tensor(self):
        with pytest.raises(ChacanaError, match="active_metric.*references unknown tensor"):
            load_context("""
[strategy]
active_metric = "g"

[manifold.M]
dimension = 4
""")

    def test_active_metric_valid(self):
        ctx = load_context("""
[strategy]
active_metric = "g"

[manifold.M]
dimension = 4

[tensor.g]
manifold = "M"
rank = 2
index_pattern = ["Covar", "Covar"]
""")
        assert ctx.active_metric == "g"

    def test_unknown_variance_string(self):
        with pytest.raises(ChacanaError, match="Unknown variance"):
            load_context("""
[manifold.M]
dimension = 4

[tensor.T]
manifold = "M"
rank = 1
index_pattern = ["Up"]
""")

    def test_tensor_missing_manifold_field(self):
        """Tensor with empty manifold string should fail validation."""
        with pytest.raises(ChacanaError, match="references unknown manifold"):
            load_context("""
[manifold.M]
dimension = 4

[tensor.T]
rank = 2
index_pattern = ["Contra", "Covar"]
""")


class TestStrategy:
    """Test strategy section parsing."""

    def test_contraction_order(self):
        ctx = load_context("""
[strategy]
contraction_order = "optimal"
active_metric = "g"

[manifold.M]
dimension = 4

[tensor.g]
manifold = "M"
rank = 2
index_pattern = ["Covar", "Covar"]
""")
        assert ctx.strategy["contraction_order"] == "optimal"
        assert ctx.active_metric == "g"

    def test_strategy_extra_keys_preserved(self):
        ctx = load_context("""
[strategy]
active_metric = "g"
contraction_order = "optimal"
custom_hint = "some_value"

[manifold.M]
dimension = 4

[tensor.g]
manifold = "M"
rank = 2
index_pattern = ["Covar", "Covar"]
""")
        assert ctx.strategy["custom_hint"] == "some_value"

    def test_no_strategy_section(self):
        ctx = load_context("""
[manifold.M]
dimension = 4
""")
        assert ctx.active_metric is None
        assert ctx.strategy == {}


class TestSparsity:
    """Test [sparsity.*] section parsing."""

    def test_sparsity_structural_zeros(self):
        ctx = load_context("""
[manifold.M]
dimension = 4

[tensor.R]
manifold = "M"
rank = 4
index_pattern = ["Contra", "Covar", "Covar", "Covar"]

[sparsity.R]
structural_zeros = [[0,0,0,0], [1,1,1,1]]
""")
        assert "R" in ctx.sparsity
        assert ctx.sparsity["R"].structural_zeros == [[0, 0, 0, 0], [1, 1, 1, 1]]

    def test_sparsity_empty(self):
        ctx = load_context("""
[manifold.M]
dimension = 4
""")
        assert ctx.sparsity == {}

    def test_sparsity_multiple(self):
        ctx = load_context("""
[manifold.M]
dimension = 4

[tensor.R]
manifold = "M"
rank = 4
index_pattern = ["Contra", "Covar", "Covar", "Covar"]

[tensor.T]
manifold = "M"
rank = 2
index_pattern = ["Contra", "Covar"]

[sparsity.R]
structural_zeros = [[0,0,0,0]]

[sparsity.T]
structural_zeros = [[0,0]]
""")
        assert len(ctx.sparsity) == 2


class TestPerturbation:
    """Test [perturbation.*] section parsing."""

    def test_perturbation_basic(self):
        ctx = load_context("""
[manifold.M]
dimension = 4

[perturbation.eps]
parameter = "epsilon"
order = 2
manifold = "M"
""")
        assert "eps" in ctx.perturbations
        p = ctx.perturbations["eps"]
        assert p.parameter == "epsilon"
        assert p.order == 2
        assert p.manifold == "M"

    def test_perturbation_references_nonexistent_manifold(self):
        with pytest.raises(ChacanaError, match="perturbation.*references unknown manifold"):
            load_context("""
[manifold.M]
dimension = 4

[perturbation.eps]
parameter = "epsilon"
order = 2
manifold = "X"
""")

    def test_perturbation_empty(self):
        ctx = load_context("""
[manifold.M]
dimension = 4
""")
        assert ctx.perturbations == {}

    def test_perturbation_multiple(self):
        ctx = load_context("""
[manifold.M]
dimension = 4

[perturbation.eps]
parameter = "epsilon"
order = 2
manifold = "M"

[perturbation.delta]
parameter = "delta"
order = 1
manifold = "M"
""")
        assert len(ctx.perturbations) == 2
        assert ctx.perturbations["eps"].parameter == "epsilon"
        assert ctx.perturbations["delta"].parameter == "delta"


class TestLoadFromPath:
    """Test loading from Path objects."""

    def test_load_from_path_object(self, tmp_path):
        from pathlib import Path

        toml_file = tmp_path / "ctx.toml"
        toml_file.write_text("""
[manifold.M]
dimension = 4

[tensor.T]
manifold = "M"
rank = 2
index_pattern = ["Contra", "Covar"]
""")
        ctx = load_context(Path(toml_file))
        assert "M" in ctx.manifolds
        assert "T" in ctx.tensors

    def test_load_from_nonexistent_path_raises_chacana_error(self):
        """Loading from a non-existent Path should raise ChacanaError, not FileNotFoundError."""
        from pathlib import Path

        with pytest.raises(ChacanaError, match="not found"):
            load_context(Path("/nonexistent/file.toml"))
