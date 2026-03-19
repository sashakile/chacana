## ADDED Requirements

### Requirement: Processor Input Contract
A Chacana-compliant processor SHALL accept a (ValidationToken, GlobalContext) pair as its primary input. The ValidationToken provides the validated expression AST; the GlobalContext provides all manifold, tensor, symmetry, sparsity, perturbation, and strategy declarations. Processors MUST NOT require re-parsing of TOML source or micro-syntax strings.

#### Scenario: Processor receives validated expression with context
- **GIVEN** a Chacana expression `R{^a _b _c _d}` parsed and type-checked against a GlobalContext declaring manifold M(dim=4) and tensor R(rank=4, symmetry=riemann)
- **WHEN** the processor receives the (ValidationToken, GlobalContext) pair
- **THEN** it MUST have access to both the expression AST (indices, variance, structure) and the full declaration context (manifold dimension, tensor symmetries, sparsity patterns) without additional parsing.

#### Scenario: Processor rejects unvalidated input
- **GIVEN** a raw expression string that has not been parsed by a Chacana parser
- **WHEN** it is passed directly to a processor
- **THEN** the processor MUST reject the input with a clear error indicating that Chacana validation is required first.

#### Scenario: Processor rejects context mismatch
- **GIVEN** a ValidationToken referencing tensor T with rank=2, generated against GlobalContext v1
- **WHEN** submitted with a GlobalContext v2 where T has rank=3
- **THEN** the processor MUST reject the input with a context mismatch error identifying the conflicting declaration.

### Requirement: Processor Operation Levels
The Processor Interface SHALL define a cumulative leveled capability system. Level 0 (Core) operations are REQUIRED for all processors. A Level N processor MUST implement all operations from Level 0 through Level N. Higher levels are OPTIONAL and declared by the processor at initialization via a CapabilityDeclaration.

#### Scenario: Level 0 processor handles contraction and canonicalization
- **GIVEN** a Level 0 processor initialized with a GlobalContext
- **WHEN** the expression `R{^a _b _a _d}` (with contraction on index `a`) is submitted
- **THEN** the processor MUST execute the contraction and return a result representing the Ricci tensor `R{_b _d}`.

#### Scenario: Level 0 processor rejects perturbation operations
- **GIVEN** a Level 0 processor
- **WHEN** a perturbation expression `@1(g{_a _b})` is submitted
- **THEN** the processor MUST return an error result indicating that perturbation operations require Level 1.

#### Scenario: Level 1 processor handles covariant derivatives
- **GIVEN** a Level 1 processor with a declared Levi-Civita connection
- **WHEN** the expression `T{^a _b ;c}` is submitted
- **THEN** the processor MUST expand the covariant derivative using the declared connection and return the result with Christoffel symbol terms.

#### Scenario: Processor declares its capability level
- **GIVEN** a processor implementation
- **WHEN** it is initialized
- **THEN** it MUST return a CapabilityDeclaration specifying `max_level` (integer 0-2) and the list of supported operations, so that orchestrators can route expressions to capable processors.

### Requirement: Processor Expression Output
A Chacana-compliant processor SHALL return computed expressions as a ValidationToken within a ProcessorResult envelope. The ValidationToken output MUST be a valid Chacana AST parseable by any Chacana-compliant tool. Processors MAY additionally return an engine-native representation alongside the ValidationToken.

#### Scenario: Processor returns canonicalized expression
- **GIVEN** a Riemann tensor expression submitted for canonicalization
- **WHEN** the processor applies Butler-Portugal canonicalization
- **THEN** the ProcessorResult MUST contain a `status` of `"ok"` and an `expression` field with the canonical ValidationToken.

#### Scenario: Processor returns error for unsupported operation
- **GIVEN** a Level 0 processor that does not implement covariant derivatives
- **WHEN** an expression with `;c` derivative indices is submitted
- **THEN** the ProcessorResult MUST contain a `status` of `"error"` and an `error` field specifying the required operation level.

### Requirement: Processor Verification Metadata
Processors SHALL include verification metadata in the ProcessorResult to enable cross-tier identity comparison. The metadata SHALL contain a deterministic hash of the canonical AST.

#### Scenario: Canonical hash enables identity comparison
- **GIVEN** two processors that canonicalize the same Riemann expression
- **WHEN** their ProcessorResults are compared
- **THEN** the `canonical_hash` fields MUST be identical when the canonical ValidationToken ASTs are structurally identical (same tree structure, same index labels after dummy index renaming). Hash collisions are permitted as a non-zero probability event.

#### Scenario: Hash is deterministic across runs
- **GIVEN** the same (ValidationToken, GlobalContext) input
- **WHEN** submitted to the same processor twice
- **THEN** the `canonical_hash` MUST be identical in both results.

### Requirement: Processor Symmetry Propagation
Processors SHALL propagate symmetry information through computations. The ProcessorResult SHALL include the symmetry group of the result expression when the operation produces or modifies symmetries.

#### Scenario: Contraction propagates symmetry
- **GIVEN** a Riemann tensor `R{^a _b _c _d}` with declared `riemann` symmetry
- **WHEN** indices `a` and `c` are contracted to produce the Ricci tensor
- **THEN** the ProcessorResult `symmetry_group` field MUST contain `["Symmetric({1, 2})"]` for the resulting rank-2 tensor.

#### Scenario: Symmetry group is absent for scalars
- **GIVEN** a full contraction producing a scalar (rank 0)
- **WHEN** the result is returned
- **THEN** the `symmetry_group` field MUST be an empty array.

### Requirement: Processor Session Lifecycle
Processors SHALL implement an explicit session lifecycle: initialize (with GlobalContext), execute (one or more operations), and teardown. All tensor declarations, cached canonicalization results, and memoized component evaluations MUST be scoped to the session.

#### Scenario: Concurrent independent sessions
- **GIVEN** two sessions initialized with different GlobalContexts (different manifold dimensions)
- **WHEN** expressions are submitted to each session concurrently
- **THEN** each session MUST operate independently with no state leakage between them.

#### Scenario: Session teardown releases resources
- **GIVEN** a session with cached canonicalization results
- **WHEN** the session is torn down
- **THEN** all cached state MUST be released and subsequent operations on the session MUST fail with a clear error.

### Requirement: Level 2 AD Metadata Passthrough
Level 2 processors SHALL expose structural metadata from the GlobalContext (symmetry groups, sparsity patterns, perturbation declarations) through their ProcessorResult, enabling downstream AD engines to exploit tensor structure for optimization.

#### Scenario: Symmetry-aware AD output
- **GIVEN** a Riemann tensor with declared `riemann` symmetry (256 components, 20 independent in 4D)
- **WHEN** a Level 2 processor compiles the expression for AD evaluation
- **THEN** the ProcessorResult `sparsity_pattern` field MUST contain the independent component indices derived from the symmetry group, enabling AD engines to reduce Jacobian computation from 256 to 20 entries.

#### Scenario: Sparsity passthrough from context
- **GIVEN** a GlobalContext with `[sparsity.Riemann]` declaring `structural_zeros = [[0,0,0,0], [1,1,1,1]]`
- **WHEN** a Level 2 processor evaluates an expression involving the Riemann tensor
- **THEN** the structural zeros MUST be available in the ProcessorResult `sparsity_pattern` field for AD graph coloring.

## Design Details

### Referenced Data Models

- **ValidationToken**: Defined in `openspec/specs/dsl-specification/spec.md` §4 "Data Models" (TypeScript interface, lines 109-129).
- **GlobalContext**: Defined in `openspec/specs/dsl-specification/spec.md` §2 "The TOML Declaration Layer". Python reference: `src/chacana/context.py:GlobalContext`.
- **ChacanaIndex**: Defined in `openspec/specs/dsl-specification/spec.md` §4 "Data Models".

### ProcessorResult Schema

```typescript
interface ProcessorResult {
  status: "ok" | "error";
  expression: ValidationToken | null;    // null when status is "error"
  canonical_hash: string | null;         // deterministic hash of canonical AST; null on error
  symmetry_group: string[];              // e.g., ["Symmetric({1, 2})"], empty for scalars
  sparsity_pattern: number[][] | null;   // independent component indices; null if not Level 2
  error: ProcessorError | null;          // null when status is "ok"
}

interface ProcessorError {
  code: "unsupported_operation" | "context_mismatch" | "invalid_input" | "computation_error";
  message: string;
  required_level: number | null;         // for unsupported_operation errors
}

interface CapabilityDeclaration {
  max_level: number;                     // 0, 1, or 2
  operations: string[];                  // exhaustive list of supported operations
  engine_name: string;                   // e.g., "xact-jl", "tequitl"
  engine_version: string;
}
```

### Operation Level Taxonomy

| Level | Name | Operations | Description |
| :--- | :--- | :--- | :--- |
**Levels are cumulative**: Level N includes all operations from Level 0 through Level N.

| Level | Name | Operations | Description |
| :--- | :--- | :--- | :--- |
| 0 | Core | `contract`, `canonicalize`, `simplify`, `evaluate` | Required for all processors. Index contraction, Butler-Portugal canonicalization, algebraic simplification, scalar evaluation. |
| 1 | Calculus | All Level 0 + `covd_expand`, `perturbation`, `ibp`, `vard`, `sort_covds`, `commute_covds` | Covariant derivatives, perturbation theory, integration by parts, variational derivatives. |
| 2 | AD | All Level 1 + `compile`, `sparsity_oracle`, `ad_metadata` | Compile to AD-transparent functions, expose symmetry-derived sparsity patterns, emit geometric AD metadata. |
