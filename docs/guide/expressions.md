# Expressions

Chacana parses tensor calculus expressions using a PEG grammar. This page
covers the supported syntax.

## Tensor expressions

A tensor with indices uses curly braces:

```
R{^a _b _c _d}     # Riemann tensor: 1 contra, 3 covariant
T{^a _b}            # Mixed rank-2 tensor
g{_a _b}            # Metric tensor (covariant)
```

- `^` marks a contravariant (upper) index
- `_` marks a covariant (lower) index

Bare identifiers without braces are also valid:

```
A                   # Bare tensor (no explicit indices)
```

## Arithmetic

```
A{^a} + B{^a}      # Sum (free indices must match)
A{^a} - B{^a}      # Subtraction
A{_a} * B{^a}      # Product with contraction
3 * T{^a _b}       # Scalar multiplication
3.14                # Scalar literal
(A + B) * C        # Parenthesized sub-expression
```

## Wedge product

```
A ^ B               # Exterior (wedge) product
d(A ^ B)            # Exterior derivative of a wedge product
```

## Index derivatives

```
T{^a _b ;c}         # Covariant derivative (semicolon)
T{^a _b ,c}         # Partial derivative (comma)
T{;a ;b}            # Double covariant derivative
```

## Symmetrization

```
T{_( a b _)}        # Symmetrize over a, b
T{_[ a b _]}        # Anti-symmetrize over a, b
T{^( a b ^)}        # Contravariant symmetrization
```

!!! warning "Nested symmetrization"
    Nested symmetrization like `T{_( _( a b _) _)}` is **rejected** by the
    parser as it is not supported in the Chacana micro-syntax.

## Functional operators

```
d(omega)            # Exterior derivative
L(X, T{^a _b})     # Lie derivative
Tr(T{^a _b})       # Trace
det(g{_a _b})      # Determinant
inv(M)              # Inverse
star(omega)         # Hodge star (requires active_metric)
i(X, omega)         # Interior product
```

## Perturbations and commutators

```
@2(g{_a _b})        # Second-order perturbation
[A, B]              # Commutator
```

## Greek indices

Greek letters are supported and automatically detected as `IndexType.GREEK`:

```
T{^α _β}           # Greek indices
g{_μ _ν}           # Metric with Greek indices
```

## Unicode normalization

All input is NFC-normalized before parsing. Decomposed characters (e.g.,
`α` + combining acute) are composed to their precomposed form.

Characters from non-Latin/Greek Unicode blocks (Cyrillic, Arabic, CJK, etc.)
are **rejected** to prevent visual spoofing.
