## Context

The Chacana ecosystem is being restructured as a monorepo hosting:
1. **Chacana** — Language-agnostic DSL spec + reference implementations (Python, Julia)
2. **Tequitl** — Julia-native tensor processor (Symbolics.jl, juliac, AD)
3. **Yachay** — Generic tensor identity/invariant database

The first processor consumer will be xAct.jl (via adapter in sxAct repo), validating the Processor Interface Contract before Tequitl is built. The design must support this incremental adoption path.

### Stakeholders
- **sxAct** — First consumer via xAct.jl adapter; migrates InvarDB to Yachay
- **Eleguá** — Orchestrator consuming processor results for multi-tier verification
- **Papers** — Geometric AD paper depends on Tequitl's AD surfaces; Chacana paper depends on processor contract formalization

### Constraints
- **juliac**: No `eval()`, no runtime code generation, no `ccall` to dynamic libraries at compile time. All types must be concrete and inferable.
- **Monorepo**: All three components share a single repository. Julia packages use `Project.toml` with path dependencies; Python packages use workspace members.
- **Chacana micro-syntax**: Yachay MUST use Chacana notation for expressing identities, dog-fooding the DSL.

## Goals / Non-Goals

### Goals
- Define the exact boundary between Chacana (validation) and processors (computation)
- Specify Tequitl's module architecture with swappable algorithm traits
- Specify Yachay's data model as a language-agnostic, queryable identity store
- Ensure all three specs are implementable independently with clear dependency ordering

### Non-Goals
- Implementation of any component (this is spec-only)
- Defining Eleguá's orchestrator protocol (separate repo/spec)
- Specifying the xAct.jl adapter (lives in sxAct repo)
- Defining specific AD algorithms (Tequitl defines surfaces, not implementations)

## Decisions

### Decision 1: Processor Input is (ValidationToken, GlobalContext) pair
The Processor Interface receives both the validated AST and the full declaration context as separate arguments. The ValidationToken remains a lean expression tree; the GlobalContext carries all manifold, tensor, symmetry, sparsity, perturbation, and strategy declarations.

**Why**: Keeps the AST serialization compact and cacheable. Processors may need different subsets of the context for different operations. Avoids bloating the JSON interchange format.

**Alternatives considered**:
- (a) Enrich ValidationToken with all metadata inline — Rejected: duplicates context data in every sub-expression, inflates JSON size, harder to cache
- (b) Processors re-parse TOML themselves — Rejected: duplicates parsing logic, risk of divergent interpretations

### Decision 2: Tequitl uses Session objects instead of global state
All tensor declarations, metrics, connections, and cached computations are scoped to an explicit `Session` object. No module-level mutable state.

**Why**: xAct.jl's global registries (`_manifolds`, `_tensors`) cause test isolation issues and prevent juliac compilation. Sessions enable concurrent independent computations and are the standard pattern for compilable Julia code.

**Alternatives considered**:
- Module-level state with `reset!()` — Rejected: xAct.jl already proved this causes problems
- Thread-local storage — Rejected: doesn't compose with juliac, harder to reason about

### Decision 3: Tequitl defines abstract trait types for swappable algorithms
Each major algorithm class (canonicalization, simplification, connection, invariant lookup) is defined as an abstract type. Concrete implementations are selected at Session construction time.

**Why**: Allows incremental adoption (start with Butler-Portugal, later add Groebner-based or heuristic canonicalizers). Enables benchmarking alternative algorithms on the same input. Required for research flexibility.

### Decision 4: Yachay uses TOML+Chacana micro-syntax for identity declarations
Identities and invariants are declared in TOML files using Chacana expressions, making the database parseable by any Chacana-compliant processor without additional tooling.

**Why**: Dog-foods the DSL. Ensures cross-language accessibility (any language with a TOML parser + Chacana parser can read the database). Eliminates the Maple/Mathematica format dependency.

**Alternatives considered**:
- JSON schema — Rejected: less human-readable than TOML for declarations
- SQL database — Rejected: adds runtime dependency, harder to version-control
- Custom binary format — Rejected: defeats language-agnostic goal

### Decision 5: Yachay separates identities from simplification strategies
The database stores identities (mathematical facts) and invariant bases (canonical forms) but does NOT hardcode the simplification pipeline. The 6-phase pipeline from InvarDB becomes a configurable strategy in Tequitl that queries Yachay.

**Why**: InvarDB's hardcoded 6-phase pipeline (cyclic → Bianchi → CovD commutation → dimension → dual) is Riemann-specific. Other tensor types (Weyl, spinors, differential forms) need different pipelines. Separating data from strategy enables extensibility.

## Risks / Trade-offs

### Risk: Processor contract too abstract
If the contract is too generic, processors won't know what to implement first.
**Mitigation**: Define a concrete "Level 0" minimal processor (parse context, evaluate contractions, canonicalize) and "Level 1+" extensions (CovD, perturbation, AD).

### Risk: juliac constraints too restrictive for Symbolics.jl
Symbolics.jl uses runtime code generation internally.
**Mitigation**: juliac compilation targets the Tequitl API boundary (compiled functions that call into Symbolics.jl). The symbolic engine itself may remain JIT-compiled, but the interface is AOT-safe.

### Risk: Yachay TOML files become unwieldy at scale
The Riemann invariant database has thousands of entries through order 14.
**Mitigation**: Yachay supports both human-authored TOML (for curated identities) and machine-generated binary snapshots (for bulk data). TOML is the source of truth; snapshots are derived.

## Resolved Questions

### Q1: Should Tequitl's Session be parametric on scalar type?
**Decision: Yes.** `Session{S}` where `S` is the scalar type (`Symbolics.Num` for symbolic mode, `Float64` for numeric evaluation, `ForwardDiff.Dual` for AD). This enables type-stable dispatch and juliac compatibility — the compiler can specialize all methods on the concrete scalar type.

### Q2: Should the Processor Interface define a streaming/incremental mode?
**Decision: No, not in this version.** Batch processing (submit expression, receive result) is sufficient for current use cases. Streaming can be added as a Level 3 extension in a future change if needed for expressions with >10,000 terms (e.g., high-order post-Newtonian computations).

### Q3: Should Yachay provenance include raw sampling data?
**Decision: Statistical summary only.** Provenance stores sample count, error bound, and random seed. Raw sampling data is reproducible from the seed and would bloat the TOML files. Consumers who need raw data can re-run the verification.

## Deferred Modifications

The following existing specs are affected by this change but will be updated in a follow-up change to keep this proposal focused:
- `foundations-rfc`: Update three-tier strategy to name Tequitl as Tier 3 (currently says "Chacana-jl").
- `dsl-specification`: Add reference to the Processor Interface Contract in the AD readiness section.
- `differential-geometry`: Add note that all operators must be implementable by Level 1+ processors.
