# Specification: Chacana DSL Specification

## Purpose
Chacana (The Bridge) is a language-agnostic, statically-typed domain-specific language (DSL) for symbolic and numerical tensor calculus. It bridges the gap between different tensor computation tools (Python, Julia, Rust, etc.) by providing a machine-parseable Penrose notation with a formal type system.

## Requirements

### Requirement: Static Index Type Checking
The DSL SHALL enforce a static type system for tensor expressions, ensuring they are mathematically well-formed before execution.

#### Scenario: Verify free index invariance in a sum
- **WHEN** a sum `A + B` is parsed
- **THEN** the set of free indices of `A` MUST be identical to the set of free indices of `B` in name, variance, and type.

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
- **`[strategy]` block**: Allows specifying contraction order hints and cost annotations. Finding the optimal contraction path is NP-hard; providing a strategy explicitly enables the AD Emitter to produce heavily optimized code.
- **`[sparsity]` and Symmetries**: Explicitly marking structural zeros and mathematical symmetries (e.g., Riemann, symmetric) to function as a Structural Oracle for AD engines.

### 3. The Static Index Type System
Enforces typing judgments for contraction consistency, free index invariance, symmetry validity, derivative compatibility, and perturbation safety.
- **Strict (Default)**: All Rules (1-5) must pass. Errors block processing.
- **Relaxed**: Certain rules emit warnings instead of errors.
- **Weil Algebra Support**: Formalizes the typing rules for tensorized Weil algebras, ensuring that higher-order partial derivatives and perturbation expansions (`@` operator) are processed in one pass while preserving type safety.

### 4. Expression DSL (Micro-syntax)
Includes syntax for spinor tokens, exterior calculus (forms), and perturbation annotations.

### 5. Formal Denotational Semantics
Defines the mathematical meaning of the syntax using a denotation function **⟦·⟧**.
- **Connections and Parallel Transport**: Maps syntax like `⟦T{^a _b ;c}⟧` directly to its mathematical meaning in terms of connections and parallel transport, guaranteeing that AD engines can generate the correct parallel transport ODEs when comparing gradients at different points on a curved manifold.

### 6. The Abstract Syntax Tree (AST) & JSON Interchange
Provides a canonical JSON representation (MathJSON-compatible) for tool interoperability and verification in the Eleguá orchestrator.
