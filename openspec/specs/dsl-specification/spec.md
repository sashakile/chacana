---
change-id: CHG-2026-03-17-003
version: 0.1.0
status: DRAFT
---
# Specification: Chacana DSL Specification

## Purpose
Chacana (The Bridge) is a language-agnostic, statically-typed domain-specific language (DSL) for symbolic and numerical tensor calculus. It bridges the gap between different tensor computation tools (Python, Julia, Rust, etc.) by providing a machine-parseable Penrose notation with a formal type system. While designed to support the Eleguá orchestrator, Chacana is fully functional as a standalone library for any project requiring machine-parseable tensor expressions.

## Requirements

### Requirement: Static Index Type Checking
The DSL SHALL enforce a static type system for tensor expressions, ensuring they are mathematically well-formed before execution. It MUST validate the index consistency of results from complex expressions and functional operators, including nested applications.

#### Scenario: Verify free index invariance in a sum
- **GIVEN** two tensors A and B
- **WHEN** a sum `A + B` is parsed
- **THEN** the set of free indices of `A` MUST be identical to the set of free indices of `B` in name, variance, and type.

#### Scenario: Free index mismatch error
- **GIVEN** a tensor `A{^a}` and a tensor `B{_a}`
- **WHEN** the sum `A + B` is parsed
- **THEN** the static checker MUST flag a variance mismatch error for the index `a`.

#### Scenario: Validate exterior derivative rank
- **GIVEN** a p-form `omega`
- **WHEN** the exterior derivative `d(omega)` is applied
- **THEN** the resulting expression MUST be identified as a (p+1)-form.

#### Scenario: Propagate types through nested operators
- **GIVEN** a 1-form `omega`
- **WHEN** nested operators like `d( *( d(omega) ) )` are parsed
- **THEN** the static checker MUST recursively propagate form degrees and variance transformations.

### Requirement: Language-Agnostic Declaration Format
The DSL SHALL support a declarative TOML-based format for defining manifolds, tensors, and symmetries that is independent of any specific computation engine.

#### Scenario: Declare a manifold in TOML
- **WHEN** a manifold is declared in a Chacana TOML file
- **THEN** it MUST be parseable by any Chacana-compliant processor (Python, Julia, etc.).

#### Scenario: Invalid manifold declaration
- **GIVEN** a TOML file with a missing required field (e.g., `dimension`)
- **WHEN** the file is parsed by the Chacana loader
- **THEN** it MUST return a schema validation error.

### Requirement: Geometric Automatic Differentiation (AD) Readiness
The DSL SHALL provide the structural and semantic metadata necessary to support native covariant automatic differentiation across its ecosystem.

#### Scenario: Optimize Jacobian via Structural Sparsity
- **GIVEN** a tensor with declared symmetries
- **WHEN** the tensor is evaluated within an AD framework
- **THEN** its declared symmetries and structural zeros MUST be exposed to enable sparse Jacobian graph coloring and reduce independent components.

### Requirement: Symmetry and Structure Preservation
The DSL SHALL ensure that every operation defines its effect on the operand's symmetry group and index structure. It MUST support explicit symmetrization and anti-symmetrization, ensuring mathematical validity of the grouped indices.

#### Scenario: Explicit Symmetrization Variance Matching
- **WHEN** the expression `T{_( a ^b _)}` is parsed
- **THEN** the static checker MUST flag an error because indices with different variance cannot be symmetrized.

#### Scenario: Explicit Symmetrization Type Matching
- **WHEN** the expression `T{_( a b _)}` is parsed where `a` is a Greek index and `b` is a Latin index
- **THEN** the static checker MUST flag an error because indices of different types cannot be symmetrized.

#### Scenario: Valid Explicit Symmetrization
- **WHEN** the expression `T{_( a b _)}` is parsed with matching variance and type
- **THEN** the resulting object MUST be assigned the corresponding symmetry group (e.g., `Symmetric({1, 2})`).

## Design Details

### 1. Design Principles
- Separation of notation from implementation.
- Separation of declarations from expressions.
- Static verification.
- Backend neutrality.
- Machine-parseable Penrose notation.
- **First-Class AD Compatibility**: Providing explicit structural metadata (symmetries, sparsity) for AD optimizations.

### 2. The TOML Declaration Layer (The Context)
Defines the **Global Context (Γ)** including meta information, perturbation parameters, and contraction optimization strategies.

```toml
[strategy]
contraction_order = "optimal" # hints for the AD emitter
active_metric = "g"          # mandatory default for implicit contractions

[sparsity.Riemann]
structural_zeros = [[0,0,0,0], [1,1,1,1]] # indices known to be zero

[perturbation.eps]
parameter = "epsilon"
order = 2
manifold = "M"
```

### 3. The Static Index Type System
Enforces typing judgments for contraction consistency, free index invariance, symmetry validity, derivative compatibility, and perturbation safety.
- **Rule 1: Contraction Consistency**: A pair of indices `(a, b)` is contractible only if their names and `index_type` match.
    - **Metric-Aware**: If an `active_metric` is defined in the strategy, same-variance contraction (`_a _a`) is permitted and interpreted as `g{^a ^b} T{_a _b}`. In multi-metric environments, explicit metric contraction is REQUIRED to avoid ambiguity.
- **Rule 3: Symmetry Validity**: Any permutation applied to a tensor must be a valid member of its declared symmetry group. Operations MUST define **Symmetry Propagation Rules** (e.g., contracting two indices of a Riemann tensor results in a symmetric Ricci tensor).

### 4. Data Models

#### ValidationToken (MathJSON)
The `ValidationToken` is the canonical JSON representation for tool interoperability. It is a strictly typed subset of MathJSON tailored for tensor calculus.

```typescript
type IndexType = "Latin" | "Greek" | "Spinor";
type Variance = "Contra" | "Covar";

interface ChacanaIndex {
  label: string;
  variance: Variance;
  type: IndexType;
}

interface ValidationToken {
  type: "TensorExpression";
  head: string; // "Add", "Multiply", "Wedge", "CovariantDerivative", etc.
  args: (ValidationToken | string | number)[];
  indices?: ChacanaIndex[];
  metadata?: {
    manifold?: string;
    symmetry?: string[];
  };
}
```

### 5. Formal Denotational Semantics
Defines the mathematical meaning of the syntax using a denotation function **⟦·⟧**. 
- **Target Mapping**: `⟦T{^a _b}⟧` maps to an element of the tensor product space $V \otimes V^*$.
- **Connections and Parallel Transport**: Maps syntax like `⟦T{^a _b ;c}⟧` directly to its mathematical meaning in terms of connections and parallel transport, guaranteeing that AD engines can generate the correct parallel transport ODEs.

### 6. The Abstract Syntax Tree (AST) & JSON Interchange
Provides a canonical JSON representation (MathJSON-compatible) for tool interoperability and verification in the Eleguá orchestrator.
