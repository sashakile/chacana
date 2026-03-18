# TOML Context

The Global Context (denoted **Γ** in the spec) declares manifolds, tensors,
metrics, and other configuration via TOML. The type checker uses this context
to validate expressions.

## Loading a context

```python
import chacana

# From a file
ctx = chacana.load_context("path/to/context.toml")

# From a string
ctx = chacana.load_context("""
[manifold.M]
dimension = 4

[tensor.T]
manifold = "M"
rank = 2
index_pattern = ["Contra", "Covar"]
""")
```

## Manifold declarations

```toml
[manifold.M]
dimension = 4           # Required
index_type = "Latin"    # "Latin" (default), "Greek", or "Spinor"
```

## Tensor declarations

```toml
[tensor.R]
manifold = "M"                                    # Must reference a declared manifold
rank = 4                                           # Number of indices
index_pattern = ["Contra", "Covar", "Covar", "Covar"]  # Variance for each slot
symmetries = [{indices = [3, 4], type = "AntiSymmetric"}]  # Optional
```

The `index_pattern` length must equal `rank`. Each entry is `"Contra"` or `"Covar"`.

Symmetry indices are **1-based** slot positions.

## Strategy

```toml
[strategy]
active_metric = "g"       # Enable metric-aware contraction
contraction_order = "optimal"  # Extra keys are preserved
```

When `active_metric` is set, same-variance contractions (e.g., `A{_a} * B{_a}`)
are permitted, interpreted as contraction through the metric.

## Sparsity patterns

```toml
[sparsity.R]
structural_zeros = [[0, 0, 0, 0], [1, 1, 1, 1]]
```

## Perturbation declarations

```toml
[perturbation.eps]
parameter = "epsilon"
order = 2
manifold = "M"           # Must reference a declared manifold
```

## Validation

The context loader performs cross-referential validation:

- Manifold `index_type` must be one of `Latin`, `Greek`, `Spinor`
- Tensor `manifold` must reference a declared manifold
- `index_pattern` length must match `rank`
- Symmetry indices must be in range `[1, rank]`
- `active_metric` must reference a declared tensor
- Perturbation `manifold` must reference a declared manifold
