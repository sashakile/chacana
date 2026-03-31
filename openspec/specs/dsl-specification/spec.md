---
change-id: CHG-2026-03-17-003
version: 1.0.0
status: STABLE
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

#### Scenario: Contraction index type mismatch
- **GIVEN** two tensors `A{_a}` and `B{^a}` where `a` in `A` is a Latin index and `a` in `B` is a Greek index
- **WHEN** the product `A * B` is parsed
- **THEN** the static checker MUST flag an index type mismatch error because contracting indices must share the same `index_type`.

#### Scenario: Metric-aware same-variance contraction
- **GIVEN** a context with an `active_metric` defined (e.g., metric `g`)
- **WHEN** the expression `A{_a} * B{_a}` is parsed (same-variance contraction)
- **THEN** the static checker MUST permit the contraction, interpreting it as an implicit metric contraction `g{^a ^b} T{_a _b}`.

#### Scenario: Same-variance contraction without metric
- **GIVEN** a context without an `active_metric`
- **WHEN** the expression `A{_a} * B{_a}` is parsed (same-variance contraction)
- **THEN** the static checker MUST flag a same-variance contraction error.

#### Scenario: Index appears more than twice in a product
- **GIVEN** three tensors `A{_a}`, `B{^a}`, and `C{_a}`
- **WHEN** the product `A * B * C` is parsed
- **THEN** the static checker MUST flag an error because index `a` appears more than twice.

#### Scenario: Rank mismatch between declaration and usage
- **GIVEN** a tensor `R` declared with rank 4 in the context
- **WHEN** `R{^a _b}` is parsed (only 2 indices provided)
- **THEN** the static checker MUST flag a rank mismatch error.

#### Scenario: Variance pattern mismatch against declaration
- **GIVEN** a tensor `R` declared with index pattern `[Contra, Covar, Covar, Covar]`
- **WHEN** `R{_a _b _c _d}` is parsed (first index is covariant instead of contravariant)
- **THEN** the static checker MUST flag a variance pattern mismatch error.

#### Scenario: Hodge star requires active metric
- **GIVEN** a context without an `active_metric`
- **WHEN** the expression `hodge(omega)` is parsed
- **THEN** the static checker MUST flag an error because the Hodge star operator requires an active metric.

#### Scenario: Interior product first argument must be a vector
- **GIVEN** a 1-form `omega` (rank 1, covariant) and another form `eta`
- **WHEN** the expression `i(omega, eta)` is parsed
- **THEN** the static checker MUST flag an error because the first argument of the interior product must be a vector field (rank 1, contravariant).

#### Scenario: Interior product undefined for 0-forms
- **GIVEN** a vector field `X` and a scalar `f` (0-form)
- **WHEN** the expression `i(X, f)` is parsed
- **THEN** the static checker MUST flag an error because the interior product is undefined for 0-forms.

#### Scenario: Lie derivative first argument must be a vector
- **GIVEN** a scalar `f` (rank 0) and a tensor `T`
- **WHEN** the expression `L(f, T)` is parsed
- **THEN** the static checker MUST flag an error because the first argument of the Lie derivative must be a vector field.

#### Scenario: Trace requires rank at least 2
- **GIVEN** a scalar `f` (rank 0)
- **WHEN** the expression `Tr(f)` is parsed
- **THEN** the static checker MUST flag an error because the trace requires a tensor of rank >= 2.

#### Scenario: Determinant requires rank 2
- **GIVEN** a rank-3 tensor `S`
- **WHEN** the expression `det(S)` is parsed
- **THEN** the static checker MUST flag an error because the determinant requires a rank-2 tensor.

#### Scenario: Inverse requires rank 2
- **GIVEN** a rank-1 tensor `X`
- **WHEN** the expression `inv(X)` is parsed
- **THEN** the static checker MUST flag an error because the inverse requires a rank-2 tensor.

### Requirement: Language-Agnostic Declaration Format
The DSL SHALL support a declarative TOML-based format for defining manifolds, tensors, and symmetries that is independent of any specific computation engine.

#### Scenario: Declare a manifold in TOML
- **WHEN** a manifold is declared in a Chacana TOML file
- **THEN** it MUST be parseable by any Chacana-compliant processor (Python, Julia, etc.).

#### Scenario: Invalid manifold declaration
- **GIVEN** a TOML file with a missing required field (e.g., `dimension`)
- **WHEN** the file is parsed by the Chacana loader
- **THEN** it MUST return a schema validation error.

#### Scenario: Invalid manifold index type
- **GIVEN** a TOML file declaring a manifold with an unrecognized `index_type` (e.g., `"Klingon"`)
- **WHEN** the file is parsed by the Chacana loader
- **THEN** it MUST return a validation error. Valid index types are `Latin`, `Greek`, and `Spinor`.

#### Scenario: Tensor references unknown manifold
- **GIVEN** a TOML file declaring a tensor whose `manifold` field names a manifold not defined in the file
- **WHEN** the file is parsed by the Chacana loader
- **THEN** it MUST return a validation error indicating the manifold reference is unknown.

#### Scenario: Index pattern length must match rank
- **GIVEN** a TOML file declaring a tensor with `rank = 3` and an `index_pattern` of length 2
- **WHEN** the file is parsed by the Chacana loader
- **THEN** it MUST return a validation error because the index pattern length does not match the declared rank.

#### Scenario: Symmetry indices must be within rank bounds
- **GIVEN** a TOML file declaring a rank-2 tensor with a symmetry referencing index 5
- **WHEN** the file is parsed by the Chacana loader
- **THEN** it MUST return a validation error because symmetry indices are 1-based and must be in the range `[1, rank]`.

#### Scenario: Active metric must reference a declared tensor
- **GIVEN** a TOML file with `[strategy] active_metric = "g"` but no tensor `g` declared
- **WHEN** the file is parsed by the Chacana loader
- **THEN** it MUST return a validation error because the active metric references an unknown tensor.

#### Scenario: Perturbation must reference a declared manifold
- **GIVEN** a TOML file declaring a perturbation whose `manifold` field names a manifold not defined in the file
- **WHEN** the file is parsed by the Chacana loader
- **THEN** it MUST return a validation error indicating the manifold reference is unknown.

### Requirement: Geometric Automatic Differentiation (AD) Readiness
The DSL SHALL provide the structural and semantic metadata necessary to support native covariant automatic differentiation across its ecosystem. The Processor Interface Contract (`openspec/specs/processor-interface/spec.md`) defines how this metadata flows from the GlobalContext to processors via the (ValidationToken, GlobalContext) pair. Level 2 processors expose AD integration surfaces as defined in `openspec/specs/tequitl-architecture/spec.md`.

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

#### Scenario: Explicit Anti-Symmetrization Variance Matching
- **WHEN** the expression `T{_[ a ^b _]}` is parsed
- **THEN** the static checker MUST flag an error because indices with different variance cannot be anti-symmetrized.

#### Scenario: Explicit Anti-Symmetrization Type Matching
- **WHEN** the expression `T{_[ a b _]}` is parsed where `a` is a Greek index and `b` is a Latin index
- **THEN** the static checker MUST flag an error because indices of different types cannot be anti-symmetrized.

#### Scenario: Declared symmetry variance validation
- **GIVEN** a tensor `T` declared symmetric in slots `[1, 2]` in the context
- **WHEN** `T{_a ^b}` is parsed (mixed variance in symmetric slots)
- **THEN** the static checker MUST flag a variance mismatch error for the declared symmetry.

#### Scenario: Nested symmetrization rejection
- **WHEN** an expression containing nested symmetrization (e.g., symmetrization inside another symmetrization) is parsed
- **THEN** the parser MUST reject it with a parse error. Nested symmetrization is not supported.

## Design Details

### 1. Design Principles
- Separation of notation from implementation.
- Separation of declarations from expressions.
- Static verification.
- Backend neutrality.
- Machine-parseable Penrose notation.
- **First-Class AD Compatibility**: Providing explicit structural metadata (symmetries, sparsity) for AD optimizations.
- **Unicode Safety**: All input MUST be NFC-normalized before parsing. Only Latin (A-Z, a-z, extended Latin), Greek (U+0370-03FF), combining diacritical marks (U+0300-036F), and standard operator characters are permitted. Disallowed Unicode blocks (Cyrillic, Arabic, CJK, etc.) MUST be rejected to prevent visual spoofing.

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
- **Rule 1: Contraction Consistency**: A pair of indices `(a, b)` is contractible only if their names and `index_type` match. An index appearing more than twice in a product is an error.
    - **Metric-Aware**: If an `active_metric` is defined in the strategy, same-variance contraction (`_a _a`) is permitted and interpreted as `g{^a ^b} T{_a _b}`. In multi-metric environments, explicit metric contraction is REQUIRED to avoid ambiguity.
- **Rule 2: Free Index Invariance**: All terms in a sum MUST have the same set of free indices (matching in label and variance). Negate nodes are transparent for free-index computation.
- **Rule 3: Symmetry Validity**: Any permutation applied to a tensor must be a valid member of its declared symmetry group. Operations MUST define **Symmetry Propagation Rules** (e.g., contracting two indices of a Riemann tensor results in a symmetric Ricci tensor). Symmetrized and anti-symmetrized index groups MUST have matching variance and matching `index_type`.
- **Rule 4: Rank and Pattern Consistency**: When a GlobalContext is provided, a tensor's usage MUST match its declared rank (number of indices) and index pattern (variance at each position). Derivative indices (`is_derivative: true`, i.e. `;c` or `,c` notation) are NOT counted toward rank and are NOT checked against the declared index pattern — they represent differential operators acting on the tensor, not intrinsic tensor slots.
- **Rule 5: Operator Constraints**: Differential geometry operators have domain constraints: `HodgeStar` requires an `active_metric`; `InteriorProduct` requires a vector (rank 1 contravariant) as its first argument and a p-form with p >= 1 as its second; `LieDerivative` requires a vector as its first argument; `Trace` requires rank >= 2; `Determinant` and `Inverse` require rank 2.

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
  is_derivative?: boolean;       // true for derivative indices (;c or ,c notation)
  derivative_type?: "Semicolon" | "Comma";  // present when is_derivative is true
}

interface ValidationToken {
  type: "TensorExpression";
  head: string; // Canonical head values:
                // "Add", "Negate", "Multiply", "Wedge", "Number",
                // "ExteriorDerivative", "LieDerivative", "HodgeStar",
                // "InteriorProduct", "Trace", "Determinant", "Inverse",
                // "Perturbation", "Commutator", or a tensor name (e.g. "R").
  args: (ValidationToken | string | number)[];
  indices?: ChacanaIndex[];
  value?: number;                // present for Number nodes
  metadata?: {
    manifold?: string;
    symmetry?: string[];
    symmetrized_groups?: number[][];      // 0-based index positions
    antisymmetrized_groups?: number[][];  // 0-based index positions
  };
}
```

### 5. Formal Denotational Semantics
Defines the mathematical meaning of the syntax using a denotation function **⟦·⟧**. 
- **Target Mapping**: `⟦T{^a _b}⟧` maps to an element of the tensor product space $V \otimes V^*$.
- **Connections and Parallel Transport**: Maps syntax like `⟦T{^a _b ;c}⟧` directly to its mathematical meaning in terms of connections and parallel transport, guaranteeing that AD engines can generate the correct parallel transport ODEs.

### 6. The Abstract Syntax Tree (AST) & JSON Interchange
Provides a canonical JSON representation (MathJSON-compatible) for tool interoperability and verification in the Eleguá orchestrator.
