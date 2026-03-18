# Differential Geometry

Chacana supports type-checked differential geometry operators. The type checker
validates argument types when a context is provided.

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
