---
change-id: CHG-2026-03-17-002
version: 1.0.0
status: STABLE
---
# Specification: Differential Geometry Operations

## Purpose
This specification defines advanced differential geometry and algebraic operators in the Chacana DSL, including exterior calculus, Lie derivatives, and tensor field operations. It enables coordinate-free symbolic manipulation and automated verification of complex geometric identities across multiple execution tiers. All operators defined here require Level 1+ processor support as defined in `openspec/specs/processor-interface/spec.md`.

## Requirements

### Requirement: Exterior Calculus
The DSL SHALL support the standard operators of exterior calculus: exterior derivative (`d`), Hodge star (`hodge`/`star`), and interior product (`i`).

#### Scenario: Exterior derivative of a wedge product
- **GIVEN** two differential forms A and B
- **WHEN** the expression `d(A ^ B)` is parsed
- **THEN** it MUST be correctly represented in the AST and satisfy the Leibniz rule $d(A \wedge B) = dA \wedge B + (-1)^p A \wedge dB$.

#### Scenario: Hodge star on a curved manifold
- **GIVEN** an active metric `g` in the global context Γ
- **WHEN** the expression `hodge(omega)` (or equivalently `star(omega)`) is parsed
- **THEN** the processor MUST use the `active_metric` from the Global Context (Γ) to compute the dual form.

#### Scenario: Hodge star without active metric
- **GIVEN** a global context Γ without an `active_metric`
- **WHEN** the expression `hodge(omega)` (or equivalently `star(omega)`) is parsed
- **THEN** the static checker MUST flag an error indicating the missing metric dependency.

#### Scenario: Interior product of a vector and a form
- **GIVEN** a vector field `X` and a p-form `omega`
- **WHEN** the interior product `i(X, omega)` is parsed
- **THEN** the static checker MUST verify the result is a (p-1)-form.

#### Scenario: Interior product with non-vector first argument
- **GIVEN** a 1-form `omega` (covariant, rank 1)
- **WHEN** the interior product `i(omega, omega)` is parsed
- **THEN** the static checker MUST flag an error because the first argument of `i` must be a vector field (rank 1, contravariant).

#### Scenario: Interior product rank mismatch
- **GIVEN** a scalar field `f` (0-form)
- **WHEN** the interior product `i(X, f)` is parsed
- **THEN** the static checker MUST flag a rank mismatch error as the interior product is undefined for 0-forms.

### Requirement: Lie Derivative
The DSL SHALL support the Lie derivative operator `L(X, T)` where `X` is a vector field and `T` is an arbitrary tensor field.

#### Scenario: Lie derivative of a metric
- **GIVEN** a vector field `X` and a metric `g`
- **WHEN** the expression `L(X, g{_a _b})` is parsed
- **THEN** it MUST be correctly represented in the AST, identifying `X` as the vector field.

#### Scenario: Lie derivative with scalar first argument
- **GIVEN** a 2-form `T` and a scalar `f`
- **WHEN** the expression `L(f, T)` is parsed
- **THEN** the static checker MUST flag an error because the first argument of `L` must be a vector field (rank 1, contravariant).

#### Scenario: Lie derivative with covariant first argument
- **GIVEN** a 1-form `omega` (covariant) and a mixed tensor `T`
- **WHEN** the expression `L(omega, T{^a _b})` is parsed
- **THEN** the static checker MUST flag an error because a covariant 1-form is not a vector field; the first argument of `L` must be contravariant.

### Requirement: Algebraic Operators
The DSL SHALL support standard algebraic operations on tensors, including trace (`Tr`), determinant (`det`), and matrix-like inverse (`inv`).

#### Scenario: Trace of a mixed tensor
- **GIVEN** a mixed tensor `T{^a _b}`
- **WHEN** the expression `Tr(T{^a _b})` is parsed
- **THEN** it MUST be identified as equivalent to the contraction `T{^a _a}`.

#### Scenario: Trace of a rank-deficient tensor
- **GIVEN** a scalar field `f` (rank 0)
- **WHEN** the expression `Tr(f)` is parsed
- **THEN** the static checker MUST flag an error because trace requires a tensor of rank 2 or higher.

#### Scenario: Determinant of a metric
- **GIVEN** a metric `g{_a _b}`
- **WHEN** the expression `det(g{_a _b})` is parsed
- **THEN** it MUST be identified as a scalar density.

#### Scenario: Determinant of a non-rank-2 tensor
- **GIVEN** a rank-3 tensor `S{_a _b _c}`
- **WHEN** the expression `det(S)` is parsed
- **THEN** the static checker MUST flag an error because determinant requires a rank-2 tensor.

#### Scenario: Inverse of a non-square tensor
- **GIVEN** a non-square tensor `T{_a _b _c}`
- **WHEN** the expression `inv(T)` is parsed
- **THEN** the static checker MUST flag a dimensionality error.

### Requirement: Indexing of Expressions
The DSL SHALL allow derivatives and indices to be attached to arbitrary expressions, not just single tensor identifiers.

#### Scenario: Covariant derivative of a product
- **GIVEN** two tensors `A` and `B`
- **WHEN** the expression `(A{_a} * B{_b}){;c}` is parsed
- **THEN** it MUST be represented as a derivative operator acting on the product node.

#### Scenario: Invalid index attachment
- **GIVEN** a tensor `A`
- **WHEN** an index block is attached to a literal number, e.g., `5{_a}`
- **THEN** the parser MUST reject the expression as syntactically invalid.
