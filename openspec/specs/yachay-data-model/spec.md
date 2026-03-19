# yachay-data-model Specification

## Purpose
TBD - created by archiving change add-processor-tequitl-yachay. Update Purpose after archive.
## Requirements
### Requirement: Language-Agnostic Identity Declaration
Yachay SHALL store tensor identities and invariant definitions in TOML files using Chacana micro-syntax for all mathematical expressions. The format MUST be parseable by any language with a TOML parser and a Chacana-compliant parser, without requiring Wolfram, Maple, or any specific CAS tooling.

#### Scenario: Declare Bianchi identity in Chacana notation
- **GIVEN** a Yachay identity file declaring the first Bianchi identity
- **WHEN** the file is parsed
- **THEN** it MUST contain the identity expressed as `R{_a _[b _c _d]} = 0` in Chacana micro-syntax, with metadata specifying tensor type, identity class, and applicability conditions.

#### Scenario: Identity file is self-contained
- **GIVEN** a Yachay identity TOML file
- **WHEN** it is read by a processor that has never seen this file before
- **THEN** the file MUST declare all tensor and manifold requirements (minimum dimension, required symmetries, connection type) needed to apply the identity, without referencing external files.

#### Scenario: Reject non-Chacana expression syntax
- **GIVEN** a Yachay file containing an identity expressed in Wolfram syntax (e.g., `RiemannCD[-a,-b,-c,-d]`)
- **WHEN** the file is validated
- **THEN** validation MUST fail with an error indicating that only Chacana micro-syntax is accepted.

#### Scenario: Raw expression accessible without Chacana parser
- **GIVEN** a language without a Chacana parser implementation
- **WHEN** the Yachay TOML file is read with a standard TOML parser
- **THEN** the Chacana expression strings MUST be accessible as plain string values for manual or external parsing.

### Requirement: Separation of Identities and Invariants
Yachay SHALL distinguish between **identities** (constraints that hold for all valid tensors of a given type, e.g., Bianchi identity) and **invariants** (scalar quantities forming a canonical basis, e.g., Kretschner scalar). These are separate data models with different schemas and query interfaces.

#### Scenario: Query identities by tensor type
- **GIVEN** a Yachay database with identities for Riemann, Weyl, and Ricci tensors
- **WHEN** a processor queries for all identities applicable to the Riemann tensor on a 4D manifold
- **THEN** the query MUST return the first Bianchi identity, second Bianchi identity, and any dimension-4-specific identities, but NOT identities that only apply to Weyl or Ricci tensors independently.

#### Scenario: Query invariants by order and case
- **GIVEN** a Yachay database with Riemann polynomial invariants through order 14
- **WHEN** a processor queries for independent invariants at degree 3 with case `[0,2]` (two covariant derivatives)
- **THEN** the query MUST return exactly the independent basis elements for that case, with their canonical expressions in Chacana notation.

#### Scenario: Identity has applicability conditions
- **GIVEN** a dimension-dependent identity that holds only in 4D (e.g., Lanczos-Lovelock)
- **WHEN** a processor on a 5D manifold queries for applicable identities
- **THEN** the dimension-dependent identity MUST NOT be returned.

### Requirement: Separation of Data and Simplification Strategy
Yachay SHALL store tensor identities, invariant basis definitions, and reduction rules but SHALL NOT encode simplification pipeline ordering. The order in which identities are applied during simplification is a processor concern, not a database concern.

#### Scenario: Processor defines simplification pipeline
- **GIVEN** a Yachay database containing cyclic identities, Bianchi identities, and dimension-dependent identities
- **WHEN** a processor builds a simplification pipeline
- **THEN** the processor MUST query Yachay for the relevant identities and determine the application order, NOT rely on Yachay to specify sequencing.

#### Scenario: Database does not hardcode phase ordering
- **GIVEN** the Yachay data model
- **WHEN** identity entries are inspected
- **THEN** there MUST NOT be a `phase` or `step` field that dictates application order. Identity classification (`algebraic`, `differential`, `dimension_dependent`) is metadata for filtering, not sequencing.

### Requirement: Invariant Reduction Rules
Yachay SHALL store reduction rules that express dependent invariants as linear combinations of independent invariants. Coefficients SHALL be exact rationals. Rules SHALL reference invariants by their canonical identifier within a (tensor_type, degree, case) namespace.

#### Scenario: Reduction of dependent Riemann invariant
- **GIVEN** a Yachay reduction rule stating that invariant #3 at degree 2, case `[0,0]` equals invariant #1 minus invariant #2
- **WHEN** a processor applies the rule
- **THEN** the substitution `inv[3] = 1 * inv[1] + (-1) * inv[2]` MUST be expressible with exact rational coefficients (no floating-point approximation).

#### Scenario: Reduction rules reference canonical basis
- **GIVEN** reduction rules for a specific (tensor_type, degree, case)
- **WHEN** the rules are loaded
- **THEN** every referenced invariant index MUST correspond to a declared invariant in the same (tensor_type, degree, case) namespace, and the independent basis MUST be explicitly marked.

#### Scenario: Reduction rule dependency graph is acyclic
- **GIVEN** reduction rules for a (tensor_type, degree, case) namespace
- **WHEN** the rules are loaded
- **THEN** the dependency graph MUST be acyclic — no invariant SHALL appear as both independent (in its own rule) and dependent (expressed via other invariants).

### Requirement: Verification Provenance
Every identity and invariant in Yachay SHALL carry a `verification_status` field with one of: `"verified"`, `"unverified"`, `"disputed"`. Entries with status `"verified"` SHALL additionally carry provenance metadata indicating how they were validated, by which tier(s), and with what confidence.

#### Scenario: Identity verified by three-tier oracle
- **GIVEN** a Bianchi identity verified by Eleguá across Tier 1 (Wolfram xAct), Tier 2 (xAct.jl), and Tier 3 (Tequitl)
- **WHEN** the provenance is inspected
- **THEN** it MUST record the verification tier(s), verification method (`symbolic`, `numeric_sampling`, or `cross_cas`), and timestamp.

#### Scenario: Numerically verified invariant with error bounds
- **GIVEN** an invariant verified by probabilistic numeric sampling (Tier 3 fallback)
- **WHEN** the provenance is inspected
- **THEN** it MUST include the sample count, the error bound (e.g., `|residual| < 1e-12`), and the random seed for reproducibility.

#### Scenario: Unverified identity is flagged
- **GIVEN** a newly added identity that has not been verified by any tier
- **WHEN** a processor queries the database
- **THEN** the identity MUST carry `verification_status = "unverified"`, and processors MAY choose to skip unverified identities in production pipelines.

### Requirement: Permutation Basis Encoding
Yachay SHALL store contraction permutations for invariants using images notation (an array of integers representing the permutation mapping). The images notation MUST be language-agnostic (no Maple cycle notation or Mathematica-specific syntax).

#### Scenario: Permutation in images notation
- **GIVEN** a contraction permutation for two Riemann tensors where slots (1,2) and (3,4) are swapped
- **WHEN** the permutation is stored in Yachay
- **THEN** it MUST be represented as `[2, 1, 4, 3, 6, 5, 8, 7]` (images notation), not as `[[2,1],[4,3],[6,5],[8,7]]` (Maple cycle notation).

#### Scenario: Permutation basis is complete for a case
- **GIVEN** a (tensor_type, degree, case) with N known independent invariants
- **WHEN** the permutation basis is loaded
- **THEN** there MUST be exactly N permutation entries, each mapping to a distinct canonical invariant.

#### Scenario: Invalid permutation is rejected
- **GIVEN** a permutation array with repeated values or values outside the range [1, N] where N is the array length
- **WHEN** the permutation is validated
- **THEN** validation MUST fail with an error identifying the invalid entry.

