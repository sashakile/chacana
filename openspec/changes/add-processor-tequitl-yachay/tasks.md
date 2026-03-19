## 1. Processor Interface Contract
- [ ] 1.1 Create `openspec/specs/processor-interface/spec.md` with all requirements from delta
- [ ] 1.2 Define ProcessorResult JSON schema validation (test that schema matches TypeScript interface in spec)
- [ ] 1.3 Define CapabilityDeclaration schema validation
- [ ] 1.4 Write processor conformance test suite skeleton (TOML test cases: input expression + expected ProcessorResult properties per operation level)
- [ ] 1.5 Validate processor contract via xAct.jl adapter conformance tests (adapter implementation tracked in sxAct-amax)

## 2. Tequitl Architecture
- [ ] 2.1 Create `openspec/specs/tequitl-architecture/spec.md` with all requirements from delta
- [ ] 2.2 Scaffold Julia package structure: `tequitl/Project.toml`, module layering (Core → Perm → Tensor → Geom → AD)
- [ ] 2.3 Define abstract trait types with method signatures: `AbstractCanonicalizer`, `AbstractSimplifier`, `AbstractConnection`, `AbstractInvariantDB`
- [ ] 2.4 Implement `Session{S}` type parametric on scalar type, with GlobalContext ingestion (type-stable, no eval)
- [ ] 2.5 Port Butler-Portugal canonicalization from xAct.jl XPerm as first `AbstractCanonicalizer` implementation
- [ ] 2.6 Implement coordinate-level symbolic computation layer (abstract-to-component lowering via Symbolics.jl)
- [ ] 2.7 Implement AD Consumer surface (Christoffel via DifferentiationInterface.jl)
- [ ] 2.8 Implement AD Emitter surface (`compile()` → differentiable Julia function)
- [ ] 2.9 Implement AD Oracle surface (symmetry → sparsity pattern)
- [ ] 2.10 Validate juliac compatibility on public API (tracer bullet: Kretschner scalar)
- [ ] 2.11 CI check: verify module dependency layering (Core imports no downstream modules)

## 3. Yachay Data Model
- [ ] 3.1 Create `openspec/specs/yachay-data-model/spec.md` with all requirements from delta
- [ ] 3.2 Define TOML schema for identities (tensor_type, class, statement, applies_when, verification)
- [ ] 3.3 Define TOML schema for invariants (tensor_type, expression, order, case, index, independent, permutation)
- [ ] 3.4 Define TOML schema for reduction rules (dependent_index → terms with independent_index + rational coefficient)
- [ ] 3.5 Implement TOML schema validator (rejects non-Chacana syntax, validates permutations, checks acyclic reduction rules)
- [ ] 3.6 Migrate InvarDB Step 1 (permutation bases) from Maple cycle notation to Yachay TOML images notation — *depends on 3.2, 3.3*
- [ ] 3.7 Migrate InvarDB Steps 2-6 (reduction rules) from Mathematica rule notation to Yachay TOML rational coefficients — *depends on 3.4*
- [ ] 3.8 Implement Julia query interface (`YachayDB <: AbstractInvariantDB`) — *depends on 2.3*
- [ ] 3.9 Verify migrated database against original InvarDB using Eleguá 3-tier comparison

## 4. Integration Validation
- [ ] 4.1 End-to-end test: Chacana parse → Processor Interface → xAct.jl adapter → Eleguá verification
- [ ] 4.2 End-to-end test: Chacana parse → Tequitl Session → Yachay query → canonicalized result
- [ ] 4.3 Tracer bullet: Kretschner scalar (Reissner-Nordstrom) through full pipeline with AD gradients

## 5. Follow-up Spec Updates (deferred)
- [ ] 5.1 Update `foundations-rfc` to name Tequitl as Tier 3 (currently "Chacana-jl")
- [ ] 5.2 Update `dsl-specification` AD readiness section to reference Processor Interface Contract
- [ ] 5.3 Update `differential-geometry` to note operators require Level 1+ processors
