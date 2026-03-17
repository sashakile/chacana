## MODIFIED Requirements

### Requirement: Static Index Type Checking
The DSL SHALL enforce a static type system for tensor expressions, ensuring they are mathematically well-formed before execution. It MUST validate the index consistency of results from complex expressions and functional operators, including nested applications.

#### Scenario: Verify free index invariance in a sum
- **WHEN** a sum `A + B` is parsed
- **THEN** the set of free indices of `A` MUST be identical to the set of free indices of `B` in name, variance, and type.

#### Scenario: Verify indexed expression
- **WHEN** an expression `(A{^a} + B{^a}){;b}` is parsed
- **THEN** the static checker MUST verify that both `A` and `B` share the free index `^a` and that `;b` is a valid derivative for the context.

#### Scenario: Validate exterior derivative rank
- **WHEN** the exterior derivative `d(omega)` is applied to a p-form `omega`
- **THEN** the resulting expression MUST be identified as a (p+1)-form.

#### Scenario: Propagate types through nested operators
- **WHEN** nested operators like `d( *( d(omega) ) )` are parsed
- **THEN** the static checker MUST recursively propagate form degrees and variance transformations.

### Requirement: Symmetry and Structure Preservation
The DSL SHALL ensure that every operation defines its effect on the operand's symmetry group and index structure. It MUST support explicit symmetrization and anti-symmetrization, ensuring mathematical validity of the grouped indices.

#### Scenario: Explicit Symmetrization Variance Matching
- **WHEN** the expression `T{_( a ^b _)}` is parsed
- **THEN** the static checker MUST flag an error because indices with different variance cannot be symmetrized.

#### Scenario: Explicit Symmetrization Type Matching
- **WHEN** the expression `T{_( a b _)}` is parsed where `a` is a Greek index and `b` is a Latin index
- **THEN** the static checker MUST flag an error because indices of different types cannot be symmetrized.

#### Scenario: Valid Explicit Symmetrization
- **WHEN** the expression `T{_( a b _)}` is parsed with matching variance and type
- **THEN** the resulting object MUST be assigned the corresponding symmetry group (e.g., `Symmetric({1, 2})`).
