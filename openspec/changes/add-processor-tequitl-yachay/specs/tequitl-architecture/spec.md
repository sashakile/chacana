## ADDED Requirements

### Requirement: Type-Stable Session Architecture
Tequitl SHALL use an explicit `Session{S}` object (parametric on scalar type `S`) to scope all tensor declarations, metric registrations, connection specifications, and cached computations. No module-level mutable state SHALL exist. All functions exported from Tequitl's public modules (Core, Perm, Tensor, Geom, AD) SHALL be type-stable (inferable return types for concrete input types).

#### Scenario: Session construction with GlobalContext
- **GIVEN** a Chacana GlobalContext declaring manifold M(dim=4), metric g(symmetric), and tensor R(rank=4, symmetry=riemann)
- **WHEN** a Tequitl `Session{Symbolics.Num}` is constructed from the context
- **THEN** the session MUST register all declarations with concrete Julia types and the construction MUST be type-stable (no `Any`-typed fields, no `eval()` calls).

#### Scenario: No global state pollution
- **GIVEN** two Tequitl Sessions initialized with different manifold dimensions
- **WHEN** tensors are defined in Session A
- **THEN** Session B MUST NOT be affected, and no module-level registry SHALL be modified.

#### Scenario: Session is juliac-compatible
- **GIVEN** a Tequitl Session with registered tensors and metrics
- **WHEN** the session's public API functions are compiled with juliac
- **THEN** compilation MUST succeed without errors related to dynamic dispatch, `eval()`, or non-inferable types.

#### Scenario: Session construction rejects invalid context
- **GIVEN** a GlobalContext declaring tensor R on manifold M, but manifold M is not declared
- **WHEN** Session construction is attempted
- **THEN** it MUST fail with a declaration validation error at construction time, not at first use.

#### Scenario: Numeric session for component evaluation
- **GIVEN** a `Session{Float64}` constructed for numeric evaluation
- **WHEN** a tensor component is evaluated at concrete coordinate values
- **THEN** the result MUST be a `Float64` value, not a symbolic expression.

### Requirement: Modular Algorithm Traits
Tequitl SHALL define abstract trait types for each major algorithmic concern: canonicalization, simplification, connection computation, and invariant lookup. Concrete algorithm implementations SHALL be selected at Session construction time and remain fixed for the session lifetime.

#### Scenario: Swappable canonicalization algorithm
- **GIVEN** a `ButlerPortugal <: AbstractCanonicalizer` and a hypothetical `HeuristicCanonicalizer <: AbstractCanonicalizer`
- **WHEN** a Session is constructed with `canonicalizer=ButlerPortugal()`
- **THEN** all canonicalization operations within that session MUST use the Butler-Portugal algorithm, and switching to HeuristicCanonicalizer MUST require a new session.

#### Scenario: Invariant database is pluggable
- **GIVEN** an `AbstractInvariantDB` trait
- **WHEN** a Session is constructed with `invariant_db=YachayDB("path/to/db")`
- **THEN** all invariant lookups and simplification queries MUST be dispatched through the provided database implementation.

#### Scenario: Default algorithms are production-ready
- **GIVEN** a Session constructed without explicit algorithm selection
- **WHEN** default algorithms are used
- **THEN** the defaults MUST be Butler-Portugal for canonicalization and Levi-Civita for connections, matching xAct's established behavior.

### Requirement: Coordinate-Level Symbolic Computation
Tequitl SHALL translate abstract index expressions to coordinate-level symbolic expressions compatible with Julia's symbolic ecosystem. The integration layer MUST convert between Chacana's abstract index representation and coordinate-level expression trees.

#### Scenario: Abstract-to-component lowering
- **GIVEN** a Tequitl Session with a Schwarzschild metric `g{_a _b}` and chart coordinates `[t, r, theta, phi]`
- **WHEN** the Riemann tensor `R{^a _b _c _d}` is evaluated in components
- **THEN** Tequitl MUST produce symbolic expressions for each independent component, exploiting declared symmetries to avoid redundant computation.

#### Scenario: Symbolic expression interoperability
- **GIVEN** a symbolic expression representing a tensor component
- **WHEN** it is returned from a Tequitl computation
- **THEN** it MUST be a standard Symbolics.jl `Num` type that integrates with DifferentialEquations.jl and Optimization.jl without wrapper conversion.

### Requirement: AD Consumer Surface
Tequitl SHALL use automatic differentiation internally for coordinate-level computations where derivatives of metric components are required, via DifferentiationInterface.jl. The implementation SHALL NOT duplicate symbolic Christoffel formulae.

#### Scenario: Christoffel symbols via AD
- **GIVEN** a metric `g{_a _b}` with known coordinate components
- **WHEN** Christoffel symbols `Gamma{^a _b _c}` are requested
- **THEN** Tequitl MUST compute them using automatic differentiation of the metric components via DifferentiationInterface.jl.

#### Scenario: Higher-order curvature via AD
- **GIVEN** Christoffel symbols computed via AD
- **WHEN** the Riemann tensor `R{^a _b _c _d}` is requested
- **THEN** Tequitl MUST compute it by differentiating the Christoffel symbols via AD, not by expanding symbolic product rules.

### Requirement: AD Emitter Surface
Tequitl SHALL compile validated Chacana expressions into AD-transparent Julia functions that are differentiable by reverse-mode AD backends.

#### Scenario: Compiled AD-transparent function
- **GIVEN** a validated Chacana expression for the Kretschner scalar `K = R{^a ^b ^c ^d} * R{_a _b _c _d}`
- **WHEN** `compile(session, expression)` is called
- **THEN** the result MUST be a Julia function `f(params...) -> scalar` that is differentiable by Mooncake.jl or ForwardDiff.jl, with gradients `df/d(params)` computable via a single reverse-mode AD pass (one forward + one backward evaluation).

#### Scenario: Compiled function preserves symmetry exploitation
- **GIVEN** a compiled function for a Riemann-derived scalar
- **WHEN** the function is evaluated
- **THEN** it MUST evaluate only the 20 independent Riemann components internally (not all 256) by exploiting the declared `riemann` symmetry during intermediate tensor computation.

### Requirement: AD Oracle Surface
Tequitl SHALL provide a sparsity oracle that translates tensor symmetry declarations into sparsity patterns suitable for sparse Jacobian graph coloring in AD engines.

#### Scenario: Sparsity pattern from symmetry
- **GIVEN** a Riemann tensor with declared `riemann` symmetry on a 4D manifold
- **WHEN** the sparsity oracle is queried
- **THEN** it MUST return a sparsity pattern indicating 20 independent components out of 256, suitable for sparse Jacobian graph coloring.

#### Scenario: Combined sparsity from symmetry and structural zeros
- **GIVEN** a tensor with declared symmetry and additional `structural_zeros` in the GlobalContext
- **WHEN** the sparsity oracle is queried
- **THEN** it MUST return the intersection of symmetry-derived and declared sparsity, giving the tightest possible pattern.

### Requirement: Module Layering
Tequitl SHALL be organized in layers with strict dependency ordering. No layer SHALL depend on a layer above it in the hierarchy. Each layer maps to a Julia submodule under the `Tequitl` namespace.

#### Scenario: Core layer has no symbolic dependency
- **GIVEN** the `Tequitl.Core` module
- **WHEN** its dependency tree is inspected
- **THEN** Symbolics.jl MUST NOT appear in its direct or transitive dependencies. It SHALL only define types, registries, and index algebra.

#### Scenario: Perm layer is algorithm-only
- **GIVEN** the `Tequitl.Perm` module implementing Butler-Portugal canonicalization
- **WHEN** it is used for tensor monomial canonicalization
- **THEN** it MUST operate purely on permutation data and symmetry group metadata, with no dependency on symbolic algebra or coordinate representations.

#### Scenario: AD layer composes with ecosystem
- **GIVEN** the `Tequitl.AD` module
- **WHEN** it produces a compiled function
- **THEN** that function MUST be compatible with SciMLSensitivity.jl for ODE sensitivity analysis and with Optimization.jl for gradient-based optimization, using standard Julia AD interfaces via DifferentiationInterface.jl.

#### Scenario: Dependency violation is detectable
- **GIVEN** the `Tequitl.Core` module source
- **WHEN** a CI check inspects its `import` and `using` statements
- **THEN** no imports from `Tequitl.Perm`, `Tequitl.Tensor`, `Tequitl.Geom`, `Tequitl.AD`, `Symbolics`, or `DifferentiationInterface` SHALL be present.

## Design Details

### Module Mapping

| Layer | Julia Module | Depends On | External Dependencies |
| :--- | :--- | :--- | :--- |
| Core | `Tequitl.Core` | (none) | (none) |
| Perm | `Tequitl.Perm` | Core | (none) |
| Tensor | `Tequitl.Tensor` | Core, Perm | (none) |
| Geom | `Tequitl.Geom` | Core, Tensor | Symbolics.jl >= 6.0 |
| AD | `Tequitl.AD` | Core, Tensor, Geom | DifferentiationInterface.jl >= 0.6, Symbolics.jl >= 6.0 |

### External Dependencies

| Package | Minimum Version | Layer | Purpose |
| :--- | :--- | :--- | :--- |
| Symbolics.jl | >= 6.0 | Geom, AD | Symbolic algebra backend for coordinate-level computation |
| DifferentiationInterface.jl | >= 0.6 | AD | Backend-agnostic AD dispatch (Mooncake.jl, ForwardDiff.jl, etc.) |
| Reexport.jl | >= 1.0 | Core | Re-export submodule APIs from top-level Tequitl |

Note: Mooncake.jl, ForwardDiff.jl, and SciMLSensitivity.jl are user-selected AD backends passed via DifferentiationInterface.jl, not direct Tequitl dependencies. Dependencies listed are direct only; transitives are implied (e.g., AD depends on Geom which depends on Tensor which depends on Perm and Core).

### Abstract Trait Types and Required Method Signatures

**Type glossary:** `SymmetryGroup`, `TensorExpr`, `IndexSlot`, `SessionContext` are defined in `Tequitl.Core`. `MetricDecl` is defined in `Tequitl.Tensor`. `InvariantEntry`, `IdentityEntry`, `ReductionRule` are defined in `Yachay`. The `Session{S}` scalar type parameter `S` does not appear in Perm or Core signatures — those layers are scalar-independent.

```julia
# --- Canonicalization ---
abstract type AbstractCanonicalizer end

# Canonicalize a tensor monomial given its contraction permutation and symmetry group.
# Returns the canonical permutation and a sign factor (+1 or -1).
canonicalize(c::AbstractCanonicalizer, perm::Vector{Int}, symmetry::SymmetryGroup) -> (Vector{Int}, Int)

# --- Simplification ---
abstract type AbstractSimplifier end

# Simplify an expression using algebraic identities.
# Returns a simplified expression and a flag indicating whether any simplification was applied.
simplify(s::AbstractSimplifier, expr::TensorExpr, ctx::SessionContext) -> (TensorExpr, Bool)

# --- Connection ---
abstract type AbstractConnection end

# Expand a covariant derivative into partial derivatives and connection terms.
expand_covd(conn::AbstractConnection, expr::TensorExpr, index::IndexSlot, ctx::SessionContext) -> TensorExpr

# Compute Christoffel symbols for a given metric at specific coordinate values.
christoffel(conn::AbstractConnection, metric::MetricDecl, coords::Vector) -> Array{<:Any, 3}

# --- Invariant Database ---
abstract type AbstractInvariantDB end

# Query independent invariants for a (tensor_type, degree, case) triple.
query_invariants(db::AbstractInvariantDB, tensor_type::Symbol, degree::Int, case::Vector{Int}) -> Vector{InvariantEntry}

# Query applicable identities for a tensor type on a manifold of given dimension.
query_identities(db::AbstractInvariantDB, tensor_type::Symbol, dimension::Int) -> Vector{IdentityEntry}

# Look up a contraction permutation and return the corresponding canonical invariant index.
lookup_perm(db::AbstractInvariantDB, case::Vector{Int}, perm::Vector{Int}) -> Union{Int, Nothing}

# Retrieve reduction rules for a (tensor_type, degree, case) triple.
query_rules(db::AbstractInvariantDB, tensor_type::Symbol, degree::Int, case::Vector{Int}) -> Vector{ReductionRule}
```
