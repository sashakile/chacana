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

## Design Details

### 1. Design Principles
- Separation of notation from implementation.
- Separation of declarations from expressions.
- Static verification.
- Backend neutrality.
- Machine-parseable Penrose notation.

### 2. The TOML Declaration Layer (The Context)
Defines the **Global Context (Γ)** including meta information, perturbation parameters, and contraction optimization strategies.

### 3. The Static Index Type System
Enforces typing judgments for contraction consistency, free index invariance, symmetry validity, derivative compatibility, and perturbation safety.
- **Strict (Default)**: All Rules (1-5) must pass. Errors block processing.
- **Relaxed**: Certain rules emit warnings instead of errors.

### 4. Expression DSL (Micro-syntax)
Includes syntax for spinor tokens, exterior calculus (forms), and perturbation annotations.

### 5. Formal Denotational Semantics
Defines the mathematical meaning of the syntax using a denotation function **⟦·⟧**.

### 6. The Abstract Syntax Tree (AST) & JSON Interchange
Provides a canonical JSON representation (MathJSON-compatible) for tool interoperability and verification in the Eleguá orchestrator.
