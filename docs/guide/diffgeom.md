# Differential Geometry

Chacana supports type-checked differential geometry operators. The type checker
validates argument types when a context is provided.

Use this page when an operator parses successfully but still fails validation because its arguments do not satisfy the expected tensor shape.

## Exterior derivative

```python
chacana.parse("d(omega)")            # ExteriorDerivative
chacana.parse("d(A ^ B)")           # Derivative of a wedge product
chacana.parse("d(omega){_a _b}")    # With explicit indices on result
```

The exterior derivative satisfies the Leibniz rule
$d(A \wedge B) = dA \wedge B + (-1)^p A \wedge dB$.
This identity is a *processor* concern, not enforced by the type checker.

## Hodge star

```python
chacana.parse("star(omega)", context=ctx)
chacana.parse("hodge(omega)", context=ctx)  # Synonym
```

!!! warning "Requires active metric"
    The Hodge star operator requires `active_metric` in the TOML context.
    Without it, the type checker raises `ChacanaTypeError`.

## Interior product

```python
chacana.parse("i(X, omega)", context=ctx)
```

The type checker validates:

- First argument must be a **vector field** (rank 1, contravariant)
- Second argument must be a **p-form with p >= 1** (interior product is undefined for 0-forms)

## Lie derivative

```python
chacana.parse("L(X, g{_a _b})", context=ctx)
```

The first argument must be a **vector field** (rank 1, contravariant).

## Trace

```python
chacana.parse("Tr(T{^a _b})", context=ctx)
```

The argument must have **rank >= 2** (needs at least two indices to contract).

## Determinant

```python
chacana.parse("det(g{_a _b})", context=ctx)
```

The argument must be a **rank-2 tensor**.

## Inverse

```python
chacana.parse("inv(M)", context=ctx)
```

The argument must be a **rank-2 tensor**. Non-rank-2 tensors raise `ChacanaTypeError`.

## Common operator failures

| Operator | Error shape | Example that fails | How to fix |
|---|---|---|---|
| `star(...)` / `hodge(...)` | `Hodge star operator requires an active_metric in the context` | `chacana.parse("star(omega)", context=ctx)` without `active_metric` | Set `[strategy] active_metric = "g"` and make sure `g` exists in the context |
| `i(X, omega)` | `Interior product first argument must be a vector field (rank 1 contravariant)` | `i(T{_a _b}, omega)` | Use a rank-1 contravariant tensor such as `X{^a}` or declare one in the context |
| `i(X, omega)` | `Interior product is undefined for 0-forms (rank 0); second argument must be a p-form with p >= 1` | `i(X, phi)` where `phi` has rank 0 | Use a tensor with at least one index as the second argument |
| `L(X, T)` | `Lie derivative first argument must be a vector field (rank 1 contravariant)` | `L(T{_a _b}, g{_a _b})` | Make the first argument a vector field |
| `Tr(T)` | `Trace requires a tensor of rank >= 2, but argument has rank 1` | `Tr(V{^a})` | Pass a tensor with at least two indices |
| `det(T)` | `Determinant requires a rank-2 tensor, but argument has rank 3` | `det(R{^a _b _c})` | Pass a rank-2 tensor |
| `inv(T)` | `Inverse requires a rank-2 tensor, but argument has rank 1` | `inv(V{^a})` | Pass a rank-2 tensor |

## Minimal operator debugging checklist

1. Check whether the operator requires a context at all
2. Confirm the argument rank from explicit indices or the TOML declaration
3. For `star`, verify `active_metric` is set and names a declared tensor
4. For `i` and `L`, make sure the first argument is a rank-1 contravariant tensor
5. Reduce the expression to the smallest failing operator call before debugging larger formulas

## Operator head mapping

The visitor maps functional operator names to canonical AST heads:

| Syntax | AST head |
|---|---|
| `d(...)` | `ExteriorDerivative` |
| `L(...)` | `LieDerivative` |
| `Tr(...)` | `Trace` |
| `det(...)` | `Determinant` |
| `inv(...)` | `Inverse` |
| `star(...)` / `hodge(...)` | `HodgeStar` |
| `i(...)` | `InteriorProduct` |
| `foo(...)` | `foo` (passthrough) |
