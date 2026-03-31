# Verification Strategies for the Tequitl Implementation

## Context

**Audience**: Chacana development team planning the Tequitl implementation phase.

Tequitl is the idiomatic Julia tensor processor (Tier 3) that will implement
Butler-Portugal canonicalization, coordinate-level symbolic computation, and
AD surfaces for geometric automatic differentiation. The implementation is
spec-complete but code has not yet been written.

This research investigates how formal verification tools — broadly, any tool
that increases confidence in correctness beyond conventional unit testing —
can validate the Tequitl implementation at multiple levels.

**Governing specifications** (all in `openspec/specs/`):
- `tequitl-architecture/spec.md` — 7 requirements (Session, Traits, Symbolic, AD Consumer/Emitter/Oracle, Layering)
- `processor-interface/spec.md` — 7 requirements (Input, Levels, Output, Metadata, Symmetry, Lifecycle, AD Passthrough)
- `yachay-data-model/spec.md` — 6 requirements (Identity, Separation, Strategy, Reduction, Provenance, Permutation)
- `foundations-rfc/spec.md` — 2 requirements (Decoupling, Three-Tier)

## Verification Targets

Seven verification targets cover the highest-risk properties of the Tequitl
architecture. See the traceability appendix at the end for full spec coverage.

### Target 1: Butler-Portugal Canonicalization (Tequitl.Perm)

The most critical algorithm. Operates on permutation groups to find canonical
representatives of tensor monomials. Must satisfy:

- **Termination**: Algorithm always halts
- **Uniqueness**: Canonical form is unique per equivalence class
- **Correctness**: Output is in the same equivalence class as input
- **Idempotency** (corollary of uniqueness, assuming the canonical form is a fixed point of the canonicalization function — true for Butler-Portugal; verify for alternative canonicalizers plugged in via the AbstractCanonicalizer trait): `canonicalize(canonicalize(x)) == canonicalize(x)` — useful as a PBT sanity check, not an independent proof obligation

This is fundamentally a computational group theory problem (base and strong
generating sets, Schreier-Sims, coset enumeration).

### Target 2: Index Algebra (Tequitl.Core)

- Each contraction pair reduces rank by 2; multi-pair contraction reduces by 2k
- Free index sets are invariant across addition terms
- Variance propagation through metric raising/lowering is consistent
- Index type (Latin/Greek/Spinor) is preserved through operations

### Target 3: Symmetry Propagation

- Contracting Riemann on slots (1,3) yields the symmetric Ricci tensor (symmetry follows from the pair symmetry R_{abcd} = R_{cdab})
- Symmetry groups are correctly computed through products, contractions, sums
- Sparsity oracle returns correct independent component count (e.g., 20 for 4D Riemann)

### Target 4: Yachay Identity Database

- Reduction rule dependency graph is acyclic
- Permutation basis is complete for each (tensor_type, degree, case) namespace
- Reduction coefficients are exact rationals (no floating-point)
- Dimension-dependent identities filtered correctly

### Target 5: Session Lifecycle & Processor Contract

- Session state machine has no unreachable states or deadlocks
- Concurrent sessions cannot corrupt shared state
- Resource cleanup always occurs on teardown
- Capability levels are cumulative (Level N implies Level 0..N-1)
- Processor rejects unvalidated input and context mismatches (Input Contract)
- ProcessorResult envelope is always well-formed (Expression Output)

### Target 6: Module Layering & Type Stability

- Core -> Perm -> Tensor -> Geom -> AD: no upward dependencies
- All public functions are type-stable (inferable return types)
- No dynamic dispatch, eval(), or Any-typed fields in Session{S}

### Target 7: AD Surface Correctness

- **Consumer**: Christoffel symbols computed via AD of metric components match
  symbolic Christoffel formulae (cross-validated against Tier 1/2)
- **Emitter**: Compiled functions are differentiable by reverse-mode AD
  backends (Mooncake.jl, ForwardDiff.jl) and produce correct gradients
- **Oracle**: Sparsity patterns from symmetry declarations match actual
  Jacobian structure (no false zeros, no missed zeros)
- AD-computed Riemann tensor matches symbolically computed Riemann tensor

**Rationale for separate target**: AD correctness is safety-critical for
scientific computing. Errors in Christoffel computation propagate silently
to all downstream curvature quantities. The three AD surfaces (Consumer,
Emitter, Oracle) in `tequitl-architecture/spec.md` each carry distinct
failure modes requiring distinct verification approaches.

## Target-to-Tool Matrix

Each target requires multiple verification approaches. This matrix shows which
tool addresses which target and in what capacity. Columns match Layer numbering
in the Recommended Verification Stack below.

```
                   Layer 1      Layer 2   Layer 3   Layer 4  Layer 5  Layer 6
                   Supposition  JET/Aqua  SMT       TLA+     Alloy    Lean 4
                   (PBT)        (static)  (constr)  (model)  (struct) (proof)
────────────────── ─────────── ───────── ───────── ──────── ──────── ────────
T1: Canonicalize   properties   n/a       n/a       n/a      n/a      term+uniq
T2: Index algebra  properties   n/a       rules     n/a      n/a      n/a
T3: Symmetry prop  properties   n/a       n/a       n/a      n/a      n/a
T4: Yachay DB      properties   n/a       schema    n/a      model    n/a
T5: Session life   gap          n/a       n/a       states   config   n/a
T6: Type/layering  n/a          types     n/a       n/a      deps     n/a
T7: AD surfaces    properties   types     n/a       n/a      n/a      n/a
```

Legend: properties = find counterexamples via random testing; rules = prove
constraint satisfaction; schema = prove metatheoretic properties of the
format; states = exhaustive state-space exploration; config = static
session configuration invariants; model = relational invariant checking;
types = compiler-level type inference; deps = dependency acyclicity;
term+uniq = termination and uniqueness proof; n/a = tool not applicable
to this target; gap = applicable but not yet covered by any tool.

## Recommended Verification Stack

### Layer 1: Property-Based Testing — Supposition.jl [START HERE]

**Effort**: Days for initial setup, ongoing investment in generator quality
(experienced Julia developer). **Targets**: 1, 2, 3, 4, 7.

**Acceptance criteria**: At minimum 8 algebraic laws as `@check` properties;
generators cover rank 0-4 tensors on dim 2-5 manifolds; zero counterexamples
after 10,000 runs per property; at least one AD cross-validation property
comparing Tequitl Christoffels against a symbolic reference.

Julia-native PBT framework (inspired by Hypothesis). Integrates with stdlib
Test via `@check` macro. Build custom `Possibility` generators for:

- Random valid tensor expressions (ASTs with correct index structures)
- Random index relabelings (permutations of dummy indices)
- Random GlobalContext configurations (manifolds, metrics, symmetries)
- Random metric component functions (for AD surface testing)

Key properties to test (pseudocode — not literal Supposition.jl API):
```julia
# Idempotency (corollary of uniqueness, but cheap to check)
@check canonicalize(canonicalize(expr)) == canonicalize(expr)
# Equivalence class preservation
@check canonicalize(relabel(expr, perm)) == canonicalize(expr)
# Rank reduction (k contracted pairs -> rank drops by 2k)
@check rank(contract(T, pairs)) == rank(T) - 2 * length(pairs)
# Free index invariance across sums
@check free_indices(A + B) requires free_indices(A) == free_indices(B)
# Sparsity oracle for known cases
@check independent_components(riemann_4d) == 20
# AD Consumer: Christoffels via AD match symbolic formula
@check christoffel_ad(metric, point) ≈ christoffel_symbolic(metric, point)
# AD Oracle: sparsity pattern has no false zeros
@check jacobian_nonzeros(f, x) ⊆ oracle_nonzeros(symmetry_group)
# AD Emitter: compiled function is differentiable
@check gradient(compile(session, expr), params) isa Vector{Float64}
```

Supposition.jl provides counterexample shrinking, so when a property fails
you get a minimal failing case.

**Generator complexity caveat**: Generating well-typed tensor expressions is
a hard combinatorial problem. Generators must produce valid ASTs (correct rank,
matching indices, declared manifolds). Start with small fixed-dimension cases
(dim=2, rank<=2) and scale up. Reference xPerm's own test suite for known-hard
canonicalization inputs as seeds.

### Layer 2: Julia Static Analysis — JET.jl + Aqua.jl [CI INTEGRATION]

**Effort**: Hours (experienced Julia developer; verify JET compatibility with
your target Julia version first — JET is tightly coupled to specific Julia
releases). **Targets**: 6, 7.

**Acceptance criteria**: `@report_opt` passes for all public API functions
with zero type instability warnings; `report_package(Tequitl)` reports zero
errors; Aqua.jl checks all pass; AD-compiled functions pass `@code_typed`
analysis with concrete return types.

JET.jl uses Julia's own type inference engine. Add to CI:
- `@report_opt` on all public API functions -> catches type instability
- `report_package(Tequitl)` -> catches missing methods, unreachable code
- Aqua.jl -> no method ambiguities, no undefined exports, no type piracy
- `@code_typed` on AD Emitter output -> compiled functions must be type-stable

This directly validates the "juliac-compatible" requirement (no dynamic
dispatch, no Any-typed fields).

### Layer 3: SMT Solvers — Satisfiability.jl [STRUCTURAL PROPERTIES]

**Effort**: 1-2 weeks (developer with some constraint programming experience).
**Targets**: 2, 4.

**Acceptance criteria**: All index algebra rules proven satisfiable (non-
contradictory); all Yachay reduction rule schemas proven to enforce acyclicity
by construction; all permutation encoding schemas proven to enforce bijection.

Satisfiability.jl (JOSS 2024, supports Z3/CVC5/Yices backends) is the
stable Julia SMT interface. SymbolicSMT.jl (SciML ecosystem, announced Sep
2025) may offer tighter Symbolics.jl integration — check current release
status before adopting.

Use SMT for proving metatheoretic properties of the specification:
- Index algebra rules are satisfiable (non-contradictory). Note: satisfiability
  proves consistency but not completeness — the rules may still silently accept
  ill-typed expressions. Completeness (all ill-typed expressions rejected)
  requires separate validation via PBT with known-bad inputs.
- Yachay schema guarantees reduction rule acyclicity by construction
  (not runtime DAG checks — a topological sort suffices for that)
- Permutation validity (bijection invariant)
- Dimension-dependent identity filtering completeness

SMT solvers excel at constraint satisfaction but cannot reason about
permutation *groups* — don't try to encode canonicalization in Z3.

### Layer 4: TLA+ — Protocol Verification [LIFECYCLE]

**Effort**: 1-2 weeks (developer familiar with TLA+; ~2 weeks to learn from
scratch using Lamport's video course). **Target**: 5.

**Acceptance criteria**: TLA+ model covers all 6 session states (Created,
Initialized, Processing, Complete, Error, TornDown); TLC/APALACHE reports
zero deadlocks, zero safety violations, and all liveness properties hold
for configurations up to 3 concurrent sessions.

Model the session state machine and processor contract in TLA+:
- States: Created -> Initialized -> Processing -> Complete/Error -> TornDown
- Properties: no state leakage between concurrent sessions, resources
  always released, capability levels cumulative
- APALACHE symbolic checker verifies for arbitrary session counts (not just
  finite configurations like TLC's bounded model checking)

TLA+ catches concurrency bugs and protocol violations that unit tests miss.
The processor interface contract (init/execute/teardown lifecycle with
CapabilityDeclaration) is a natural fit. TLA+ validates *temporal* properties:
liveness (sessions eventually terminate), safety (no state corruption),
deadlock freedom.

**Limitation**: TLA+ validates the *design*, not the Julia implementation.
Julia's concurrency model (Tasks, Channels, @spawn) has specific semantics
that may not map cleanly to TLA+'s interleaving model. Runtime stress
testing is still needed alongside the TLA+ model.

### Layer 5: Alloy 6 — Structural Invariants [DATA MODEL]

**Effort**: Days (Alloy has a gentle learning curve). **Targets**: 4, 5.

**Acceptance criteria**: Alloy model covers GlobalContext well-formedness
(every tensor references a declared manifold), module layering partial order,
and Yachay namespace integrity; Alloy Analyzer finds zero counterexamples
within scope 10.

Alloy validates *structural* (static) invariants — complementary to TLA+'s
*temporal* (dynamic) properties. For Target 5, Alloy checks the static
session configuration (well-formed GlobalContext, valid CapabilityDeclaration),
while TLA+ checks the dynamic state transitions (lifecycle correctness,
concurrency safety).

Model the Yachay data model and module dependency structure:
- Module layering as a partial order (verify acyclicity, no upward deps)
- GlobalContext well-formedness (every tensor references a declared manifold)
- Reduction rule namespace integrity

Alloy's relational modeling + counterexample finding is ideal for
structural invariants on data models.

### Layer 6: Lean 4 + Mathlib — Formal Correctness Proofs [ASPIRATIONAL]

**Effort**: Months (requires proficiency in Lean 4 theorem proving; basic
Lean programming takes days, but proof proficiency takes 2-4 months of
dedicated study; if no team member has Lean experience, effective effort
is 4-6 months including ramp-up). **Target**: 1.

**Acceptance criteria**: Lean proof of Butler-Portugal termination and
canonical form uniqueness compiles against current Mathlib; proof covers
the abstract algorithm (not implementation-specific optimizations).

Mathlib has the foundations: group theory, permutation groups, Cayley's theorem,
Sylow theorems, exterior algebra, Clifford algebra. The building blocks exist
to formalize Butler-Portugal, but:

- Schreier-Sims algorithm formalization does not yet exist in Mathlib
- No direct Lean-Julia interop (Lean FFI is C-based; proofs serve as
  correctness certificates, not runtime components)
- Significant research effort

Best approach: prove termination + uniqueness of the canonical form
algorithm in Lean, implement separately in Julia, use PBT as the bridge
(test the actual Julia code against the properties proven in Lean).

## Implementation Dependency: Oscar.jl

Oscar.jl is **not a verification tool** but is relevant context for Target 1.
It provides production-quality permutation group operations in Julia: base and
strong generating sets, stabilizer chains, orbit computation. It could serve
as the computational foundation for implementing Butler-Portugal.

**Dependency weight caveat**: Oscar.jl depends on Singular, GAP, polymake, and
FLINT — heavy C/C++ transitive dependencies that may conflict with the
juliac-compatibility requirement. Investigate whether AbstractAlgebra.jl
(lighter-weight, pure Julia) provides sufficient permutation group operations,
or confine Oscar.jl to test-time only (reference oracle, not runtime dep).

The implementation can be tested against xPerm (Wolfram) as a reference oracle
via the three-tier verification strategy.

## Integration with Three-Tier Verification

The existing three-tier strategy (Wolfram xAct -> xAct.jl -> Tequitl) is
already a form of cross-implementation testing oracle. Verification tools add
a fourth dimension:

```
Tier 1 (Wolfram xAct)  <-->  Tier 2 (xAct.jl)  <-->  Tier 3 (Tequitl)
                                                             |
                                         PBT tests Tier 3 directly,
                                         compares outputs against
                                         Tier 1/2 via canonical_hash
                                                             |
              SMT validates Yachay schema (shared across all tiers)
              Lean proves shared algorithm correct (independent of tiers)
```

The canonical_hash in ProcessorResult enables comparing outputs across tiers.
PBT tests the Tier 3 implementation directly and uses Tier 1/2 as reference
oracles. SMT validates structural properties of shared schemas. Lean proofs
certify algorithm correctness. Together they form a comprehensive verification
envelope.

## What Provers Buy Beyond Three-Tier

Three-tier verification catches **implementation bugs** (tier A disagrees with
tier B), but cannot catch **systematic errors** where all three tiers implement
the same incorrect algorithm. Formal proofs validate the algorithm itself
against mathematical axioms — they answer "is Butler-Portugal correct?" rather
than "do our implementations agree?"

**Verification gap caveat**: This holds only when the formal proof covers
the *same* algorithm as the implementation. If Lean proves a simplified
Butler-Portugal correct, but the Julia implementation uses optimizations
(heuristic tie-breaking, caching) not in the proof, the gap remains. PBT
is the bridge: test the *actual optimized code* against properties the proof
guarantees about the *abstract algorithm*.

## Feedback Integration

When a verification tool finds an issue:

| Tool | Output | Action |
|------|--------|--------|
| Supposition.jl | Minimal counterexample | Create beads bug with reproducer; fix triggers re-run |
| JET.jl | Type instability warning | CI gate blocks merge; developer fixes inference path |
| SMT solver | UNSAT (constraint violated) | Spec amendment or implementation fix depending on root |
| TLA+ | Counterexample trace | Protocol redesign before implementation proceeds |
| Alloy | Counterexample instance | Data model or layering spec revision |
| Lean 4 | Proof obligation unprovable | Algorithm redesign or weaker theorem formulation |

## Decision Points

1. **Commit to PBT from day one?**
   Supposition.jl generators should be built alongside the Tequitl
   implementation, not after — property definitions serve as executable
   specifications during development.
   **Owner**: Tequitl implementation lead.
   **Default if undecided**: Yes — PBT is low-cost and high-signal; no reason
   to defer. First property should be committed alongside the first Julia
   module.

2. **TLA+ before or during implementation?**
   Modeling the session lifecycle and processor contract *before* writing
   Julia code catches design-level protocol bugs that are expensive to fix
   later.
   **Owner**: Tequitl implementation lead.
   **Default if undecided**: Before — the session lifecycle is small enough
   to model in 1-2 days; do it during the scaffold phase (beads chacana-n37.3).

3. **Oscar.jl or AbstractAlgebra.jl?**
   This affects juliac compatibility. Benchmark permutation group operations
   in both to determine if the lighter-weight option suffices.
   **Owner**: Tequitl implementation lead.
   **Default if undecided**: Start with AbstractAlgebra.jl (pure Julia,
   lighter); escalate to Oscar.jl only if permutation group operations are
   insufficient. Keep Oscar.jl as a test-time reference oracle regardless.

4. **Lean formalization: project goal or future aspiration?**
   If a team member has Lean experience, formalizing the core canonicalization
   theorem during implementation is high-value. Otherwise, defer to post-v1.
   **Owner**: Project lead.
   **Default if undecided**: Defer to post-v1. PBT provides sufficient
   confidence for initial release; Lean formalization becomes a publication-
   grade deliverable when resources allow.

## Tools NOT Recommended

- **Z3.jl**: Dead (pre-Julia 1.0). Use Satisfiability.jl instead.
- **Coq/MathComp**: Steeper learning curve than Lean 4 for equivalent or
  lesser coverage of our specific needs.
- **Isabelle/HOL**: No tensor-specific formalizations in AFP.
- **Dafny**: Verification-aware language, but we're writing Julia, not Dafny.

## Traceability Appendix

### tequitl-architecture/spec.md (7 requirements)

| Spec Requirement | Target | Coverage |
|---|---|---|
| Type-Stable Session Architecture | T6 | JET/Aqua type checks |
| Modular Algorithm Traits | T1 | PBT (swappable canonicalizer properties) |
| Coordinate-Level Symbolic Computation | T7 | PBT (AD cross-validation) |
| AD Consumer Surface | T7 | PBT (Christoffel AD vs symbolic) |
| AD Emitter Surface | T7 | PBT + JET (compiled function differentiability + type stability) |
| AD Oracle Surface | T7 | PBT (sparsity pattern correctness) |
| Module Layering | T6 | JET/Aqua + Alloy (import analysis + dependency model) |

### processor-interface/spec.md (7 requirements)

| Spec Requirement | Target | Coverage |
|---|---|---|
| Processor Input Contract | T5 | TLA+ (reject invalid input states) + PBT (known-bad inputs) |
| Processor Operation Levels | T5 | TLA+ (capability level cumulation) |
| Processor Expression Output | T5 | PBT (output well-formedness) |
| Processor Verification Metadata | T1 | PBT (canonical_hash determinism + cross-tier comparison) |
| Processor Symmetry Propagation | T3 | PBT (symmetry through operations) |
| Processor Session Lifecycle | T5 | TLA+ (state machine) + Alloy (configuration) |
| Level 2 AD Metadata Passthrough | T7 | PBT (sparsity pattern in ProcessorResult) |

### yachay-data-model/spec.md (6 requirements)

| Spec Requirement | Target | Coverage |
|---|---|---|
| Language-Agnostic Identity Declaration | T4 | SMT (schema validation) |
| Separation of Identities and Invariants | T4 | Alloy (data model invariants) |
| Separation of Data and Simplification Strategy | T4 | Alloy (no phase/step fields in model) |
| Invariant Reduction Rules | T4 | SMT (acyclicity, exact rationals) + PBT (reduction correctness) |
| Verification Provenance | T4 | PBT (provenance metadata completeness) |
| Permutation Basis Encoding | T4 | SMT (bijection) + PBT (basis completeness) |

### foundations-rfc/spec.md (2 requirements)

| Spec Requirement | Target | Coverage |
|---|---|---|
| Decoupling of DSL and Harness | n/a | Architectural; not a Tequitl verification target |
| Three-Tier Verification | T1, T7 | PBT cross-tier oracle; canonical_hash comparison |

## References

- Supposition.jl: https://github.com/Seelengrab/Supposition.jl
- JET.jl: https://github.com/aviatesk/JET.jl
- Aqua.jl: https://github.com/JuliaTesting/Aqua.jl
- Satisfiability.jl: https://github.com/elsoroka/Satisfiability.jl (JOSS 2024)
- Oscar.jl permutation groups: https://docs.oscar-system.org/dev/Groups/permgroup/
- AbstractAlgebra.jl: https://nemocas.github.io/AbstractAlgebra.jl/latest/perm/
- Mathlib4: https://github.com/leanprover-community/mathlib4
- Lean-ga (geometric algebra in Lean): https://github.com/pygae/lean-ga
- xPerm (Butler-Portugal reference): https://arxiv.org/abs/0803.0862
- Alloy 6: https://alloytools.org/
- TLA+ / APALACHE: https://github.com/tlaplus/tlaplus
