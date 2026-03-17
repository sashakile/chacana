# Specification: Differential Geometry Operations

## Purpose
This specification defines advanced differential geometry and algebraic operators in the Chacana DSL, including exterior calculus, Lie derivatives, and tensor field operations.

## ADDED Requirements

### Requirement: Exterior Calculus
The DSL SHALL support the standard operators of exterior calculus: exterior derivative (`d`), Hodge star (`*`), and interior product (`i`).

#### Scenario: Exterior derivative of a wedge product
- **WHEN** the expression `d(A ^ B)` is parsed
- **THEN** it MUST be correctly represented in the AST and satisfy the Leibniz rule $d(A \wedge B) = dA \wedge B + (-1)^p A \wedge dB$.

#### Scenario: Hodge star on a curved manifold
- **WHEN** the expression `*(omega)` is parsed
- **THEN** the processor MUST use the `active_metric` from the Global Context (Γ) to compute the dual form.

#### Scenario: Interior product of a vector and a form
- **WHEN** the interior product `i(X, omega)` is parsed where `X` is a vector and `omega` is a p-form
- **THEN** the static checker MUST verify the result is a (p-1)-form.

### Requirement: Lie Derivative
The DSL SHALL support the Lie derivative operator `L(X, T)` where `X` is a vector field and `T` is an arbitrary tensor field.

#### Scenario: Lie derivative of a metric
- **WHEN** the expression `L(X, g{_a _b})` is parsed
- **THEN** it MUST be correctly represented in the AST, identifying `X` as the vector field.

### Requirement: Algebraic Operators
The DSL SHALL support standard algebraic operations on tensors, including trace (`Tr`), determinant (`det`), and matrix-like inverse (`inv`).

#### Scenario: Trace of a mixed tensor
- **WHEN** the expression `Tr(T{^a _b})` is parsed
- **THEN** it MUST be identified as equivalent to the contraction `T{^a _a}`.

#### Scenario: Determinant of a metric
- **WHEN** the expression `det(g{_a _b})` is parsed
- **THEN** it MUST be identified as a scalar density.

### Requirement: Indexing of Expressions
The DSL SHALL allow derivatives and indices to be attached to arbitrary expressions, not just single tensor identifiers.

#### Scenario: Covariant derivative of a product
- **WHEN** the expression `(A{_a} * B{_b}){;c}` is parsed
- **THEN** it MUST be represented as a derivative operator acting on the product node.
