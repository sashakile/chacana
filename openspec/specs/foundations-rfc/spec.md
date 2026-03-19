---
change-id: CHG-2026-03-17-001
version: 0.1.0
status: DRAFT
---
# Specification: Eleguá and Chacana Foundations RFC

## Purpose
This RFC defines the architectural pivot to decouple the `sxAct` project into two primary pillars: **Eleguá** (The Orchestrator) and **Chacana** (The Language). It establishes the three-tier execution strategy and the use of a common intermediate representation (CIR) for universal symbolic interchange.

## Requirements

### Requirement: Decoupling of DSL and Harness
The system SHALL separate the tensor calculus DSL (Chacana) from the test orchestration harness (Eleguá).

#### Scenario: Reuse Eleguá for different domains
- **GIVEN** a domain-agnostic Eleguá orchestrator
- **WHEN** a new symbolic domain like RUBI is implemented
- **THEN** it MUST be possible to reuse the Eleguá orchestrator with a different domain plugin.

#### Scenario: Invalid domain plugin
- **GIVEN** an Eleguá orchestrator
- **WHEN** an incompatible or malformed domain plugin is loaded
- **THEN** Eleguá MUST reject the plugin and provide a diagnostic error.

### Requirement: Three-Tier Verification
The system SHALL support verification across three distinct execution tiers to prove mathematical equivalence.

#### Scenario: Verify Tier 3 against Tier 1
- **GIVEN** a mathematical expression defined in Chacana
- **WHEN** a result from the Tequitl engine (Tier 3) is compared
- **THEN** it MUST be verified against the Wolfram xAct "Gold Standard" (Tier 1).

#### Scenario: Divergent tier results
- **GIVEN** results from Tier 1 and Tier 3
- **WHEN** the results are mathematically non-equivalent
- **THEN** the verification engine MUST flag a CRITICAL discrepancy and halt the pipeline.

## Design Details

### 1. The Three-Tier Strategy
- **Tier 1 (Wolfram xAct)**: The Gold Standard.
- **Tier 2 (xAct-jl)**: Literal Julia port.
- **Tier 3 (Tequitl)**: Idiomatic Julia processor using `Symbolics.jl`, compilable via juliac. See `openspec/specs/tequitl-architecture/spec.md`.

### 2. Implementation Roadmap
- **Phase 1: Eleguá Core**: Generalization of the runner into a domain-agnostic orchestrator.
- **Phase 2: Chacana-Spec**: Implementation of the standalone DSL and static type system. Includes the Python prototype (`chacana-spec-py`) as the initial verification target.
- **Phase 3: xAct-jl**: Completion of the literal functional port.
- **Phase 4: Tequitl**: Development of the idiomatic Julia processor. Architecture defined in `openspec/specs/tequitl-architecture/spec.md`. Consumes Chacana via the Processor Interface Contract (`openspec/specs/processor-interface/spec.md`).

### 3. Scientific Impact
Eleguá and Chacana represent a shift from porting code to verifying mathematics, providing an infrastructure of trust and a machine-parseable notation for physicists. 
Furthermore, Chacana's explicit separation of notation from numerical evaluation creates the foundational structural metadata required to support native **Geometric Automatic Differentiation (AD)** within the computation layer (Tequitl, Tier 3). The Processor Interface Contract (`openspec/specs/processor-interface/spec.md`) formalizes the boundary between Chacana (validation) and processors (computation).

## Data Models

### ValidationToken (MathJSON)
The `ValidationToken` is a canonical JSON representation used for cross-tier verification. It follows the MathJSON specification with extensions for tensor calculus.

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
  head: string; // e.g., "Add", "Multiply", "CovariantDerivative"
  args: (ValidationToken | string | number)[];
  indices?: ChacanaIndex[];
  metadata?: {
    manifold?: string;
    symmetry?: string[];
  };
}
```

## Glossary of Terms

| Term | Definition |
| :--- | :--- |
| **Global Context (Γ)** | The set of manifolds, tensors, metrics, and strategy hints defined in the TOML declaration layer. |
| **ValidationToken** | A canonical JSON AST representation of a tensor expression, used for cross-tier verification. |
| **Slot** | A specific position in a tensor's index structure (e.g., the first 'a' in `T{_a _b}`). |
| **Micro-syntax** | The compact string notation used for tensor expressions (e.g., `R{^a _b _c _d}`). |
| **Orchestrator** | The Eleguá task runner that coordinates symbolic tasks across multiple execution tiers. |
| **Metric-Aware** | A parsing mode where implicit contractions are resolved using a declared `active_metric`. |
