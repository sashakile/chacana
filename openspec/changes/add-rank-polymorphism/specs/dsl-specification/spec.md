## MODIFIED Requirements
### Requirement: The Static Index Type System
The checker MUST enforce typing judgments for contraction consistency, free index invariance, symmetry validity, derivative compatibility, and perturbation safety.
- **Rule 1: Contraction Consistency**: A pair of indices `(a, b)` is contractible only if their names and `index_type` match. An index appearing more than twice in a product is an error.
    - **Metric-Aware**: If an `active_metric` is defined in the strategy, same-variance contraction (`_a _a`) is permitted and interpreted as `g{^a ^b} T{_a _b}`. In multi-metric environments, explicit metric contraction is REQUIRED to avoid ambiguity.
- **Rule 2: Free Index Invariance**: All terms in a sum MUST have the same set of free indices (matching in label and variance). Negate nodes are transparent for free-index computation.
- **Rule 3: Symmetry Validity**: Any permutation applied to a tensor must be a valid member of its declared symmetry group. Operations MUST define **Symmetry Propagation Rules** (e.g., contracting two indices of a Riemann tensor results in a symmetric Ricci tensor). Symmetrized and anti-symmetrized index groups MUST have matching variance and matching `index_type`.
- **Rule 4: Rank and Pattern Consistency**: When a GlobalContext is provided, a tensor's usage MUST match its declared rank (number of indices) and index pattern (variance at each position). Derivative indices (`is_derivative: true`, i.e. `;c` or `,c` notation) are NOT counted toward rank and are NOT checked against the declared index pattern — they represent differential operators acting on the tensor, not intrinsic tensor slots.
    - **Rank Polymorphism**: If an `active_metric` is defined, a tensor MAY be used with fewer indices than its declared rank, provided the difference is even (each missing pair of indices represents an implicit metric contraction/trace). An odd difference MUST be rejected. Variance pattern checking is skipped when `active_metric` is present.
- **Rule 5: Operator Constraints**: Differential geometry operators have domain constraints: `HodgeStar` requires an `active_metric`; `InteriorProduct` requires a vector (rank 1 contravariant) as its first argument and a p-form with p >= 1 as its second; `LieDerivative` requires a vector as its first argument; `Trace` requires rank >= 2; `Determinant` and `Inverse` require rank 2.

#### Scenario: Rank polymorphism with active metric (Gauss-Bonnet)
- **GIVEN** a tensor `R` declared with rank 4 and a context with `active_metric = "g"`
- **WHEN** the expression `R * R - 4 * R{_a _b} * R{^a ^b} + R{_a _b _c _d} * R{^a ^b ^c ^d}` is parsed
- **THEN** the static checker MUST accept all three usages of `R` (at ranks 0, 2, and 4)

#### Scenario: Odd rank difference rejected with active metric
- **GIVEN** a tensor `R` declared with rank 4 and a context with `active_metric = "g"`
- **WHEN** `R{_a _b _c}` is parsed (3 indices, odd difference from rank 4)
- **THEN** the static checker MUST flag a rank error

#### Scenario: Rank polymorphism rejected without active metric
- **GIVEN** a tensor `R` declared with rank 4 and a context without `active_metric`
- **WHEN** `R{_a _b}` is parsed (2 indices)
- **THEN** the static checker MUST flag a rank mismatch error
