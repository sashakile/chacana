# Expressions

Chacana parses tensor calculus expressions using a PEG grammar. This page
covers the supported syntax.

## TL;DR

Use this page when you want a syntax catalog for valid Chacana expressions.

Prerequisites:
- you already have Chacana installed or are using the playground
- you want examples of the concrete surface syntax, not the full type-checking rules

## Write tensor expressions

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

## Combine expressions with arithmetic

```
A{^a} + B{^a}      # Sum (free indices must match)
A{^a} - B{^a}      # Subtraction
A{_a} * B{^a}      # Product with contraction
3 * T{^a _b}       # Scalar multiplication
3.14                # Scalar literal
(A + B) * C        # Parenthesized sub-expression
```

## Use the wedge product

```
A ^ B               # Exterior (wedge) product
d(A ^ B)            # Exterior derivative of a wedge product
```

## Write derivative indices

```
T{^a _b ;c}         # Covariant derivative (semicolon)
T{^a _b ,c}         # Partial derivative (comma)
T{;a ;b}            # Double covariant derivative
```

## Write symmetrization and anti-symmetrization

```
T{_( a b _)}        # Symmetrize over a, b
T{_[ a b _]}        # Anti-symmetrize over a, b
T{^( a b ^)}        # Contravariant symmetrization
```

!!! warning "Nested symmetrization"
    Nested symmetrization like `T{_( _( a b _) _)}` is **rejected** by the
    parser as it is not supported in the Chacana micro-syntax.

## Call functional operators

```
d(omega)            # Exterior derivative
L(X, T{^a _b})     # Lie derivative
Tr(T{^a _b})       # Trace
det(g{_a _b})      # Determinant
inv(M)              # Inverse
star(omega)         # Hodge star (requires active_metric)
i(X, omega)         # Interior product
```

## Write perturbations and commutators

```
@2(g{_a _b})        # Second-order perturbation
[A, B]              # Commutator
```

## Use Greek indices

Greek letters are supported and automatically detected as `IndexType.GREEK`:

```
T{^α _β}           # Greek indices
g{_μ _ν}           # Metric with Greek indices
```

## Understand Unicode normalization and character rejection

All input is NFC-normalized before parsing. Decomposed characters (e.g.,
`α` + combining acute) are composed to their precomposed form.

Characters from non-Latin/Greek Unicode blocks (Cyrillic, Arabic, CJK, etc.)
are **rejected** to prevent visual spoofing.
