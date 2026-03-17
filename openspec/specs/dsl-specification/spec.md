# Specification: Chacana DSL Specification

## Purpose
Chacana (The Bridge) is a language-agnostic, statically-typed domain-specific language (DSL) for symbolic and numerical tensor calculus. It bridges the gap between different tensor computation tools (Python, Julia, Rust, etc.) by providing a machine-parseable Penrose notation with a formal type system. While designed to support the Eleguá orchestrator, Chacana is fully functional as a standalone library for any project requiring machine-parseable tensor expressions.
## Requirements
### Requirement: Static Index Type Checking
The DSL SHALL enforce a static type system for tensor expressions, ensuring they are mathematically well-formed before execution. It MUST validate the index consistency of results from complex expressions and functional operators, including nested applications.

#### Scenario: Verify free index invariance in a sum
- **WHEN** a sum `A + B` is parsed
- **THEN** the set of free indices of `A` MUST be identical to the set of free indices of `B` in name, variance, and type.

#### Scenario: Verify indexed expression
- **WHEN** an expression `(A{^a} + B{^a}){;b}` is parsed
- **THEN** the static checker MUST verify that both `A` and `B` share the free index `^a` and that `;b` is a valid derivative for the context.

#### Scenario: Validate exterior derivative rank
- **WHEN** the exterior derivative `d(omega)` is applied to a p-form `omega`
- **THEN** the resulting expression MUST be identified as a (p+1)-form.

#### Scenario: Propagate types through nested operators
- **WHEN** nested operators like `d( *( d(omega) ) )` are parsed
- **THEN** the static checker MUST recursively propagate form degrees and variance transformations.

### Requirement: Language-Agnostic Declaration Format
The DSL SHALL support a declarative TOML-based format for defining manifolds, tensors, and symmetries that is independent of any specific computation engine.

#### Scenario: Declare a manifold in TOML
- **WHEN** a manifold is declared in a Chacana TOML file
- **THEN** it MUST be parseable by any Chacana-compliant processor (Python, Julia, etc.).

### Requirement: Geometric Automatic Differentiation (AD) Readiness
The DSL SHALL provide the structural and semantic metadata necessary to support native covariant automatic differentiation across its ecosystem.

#### Scenario: Optimize Jacobian via Structural Sparsity
- **WHEN** a tensor is evaluated within an AD framework
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

- **`[strategy]` block**: Allows specifying contraction order hints and cost annotations. Finding the optimal contraction path is NP-hard; providing a strategy explicitly enables the AD Emitter to produce heavily optimized code.
- **`[sparsity]` and Symmetries**: Explicitly marking structural zeros and mathematical symmetries (e.g., Riemann, symmetric) to function as a Structural Oracle for AD engines.

### 3. The Static Index Type System
Enforces typing judgments for contraction consistency, free index invariance, symmetry validity, derivative compatibility, and perturbation safety.
- **Rule 1: Contraction Consistency**: A pair of indices `(a, b)` is contractible only if their names and `index_type` match.
    - **Metric-Aware**: If an `active_metric` is defined in the strategy, same-variance contraction (`_a _a`) is permitted and interpreted as `g{^a ^b} T{_a _b}`. In multi-metric environments, explicit metric contraction is REQUIRED to avoid ambiguity.
- **Rule 3: Symmetry Validity**: Any permutation applied to a tensor must be a valid member of its declared symmetry group. Operations MUST define **Symmetry Propagation Rules** (e.g., contracting two indices of a Riemann tensor results in a symmetric Ricci tensor).
- **Weil Algebra Support**: Formalizes the typing rules for tensorized Weil algebras. **Note**: Weil algebra "one-pass" safety is restricted to commutative infinitesimal operators (partial derivatives, scalar perturbations). Covariant perturbations involving non-commutative derivatives (Ricci identity) require sequential processing unless a non-commutative extension is explicitly declared.

### 4. Expression DSL (Micro-syntax)
Includes syntax for spinor tokens, exterior calculus (forms), and perturbation annotations.

### 5. Formal Denotational Semantics
Defines the mathematical meaning of the syntax using a denotation function **⟦·⟧**. 
- **Target Mapping**: `⟦T{^a _b}⟧` maps to an element of the tensor product space $V \otimes V^*$.
- **Connections and Parallel Transport**: Maps syntax like `⟦T{^a _b ;c}⟧` directly to its mathematical meaning in terms of connections and parallel transport, guaranteeing that AD engines can generate the correct parallel transport ODEs when comparing gradients at different points on a curved manifold.

### 6. The Abstract Syntax Tree (AST) & JSON Interchange
Provides a canonical JSON representation (MathJSON-compatible) for tool interoperability and verification in the Eleguá orchestrator.

