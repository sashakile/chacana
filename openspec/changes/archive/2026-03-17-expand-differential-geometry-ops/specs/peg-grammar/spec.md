## MODIFIED Requirements

### Requirement: Deterministic Parsing
The PEG grammar SHALL provide a deterministic way to parse tensor expressions into a structured Abstract Syntax Tree (AST). It MUST support recursive indexing on parenthesized expressions and functional operators for algebra and geometry.

#### Scenario: Parse a standard tensor expression
- **WHEN** the string `R{^a _b _c _d}` is parsed
- **THEN** it MUST produce a JSON AST representing a tensor `R` with four specified indices.

#### Scenario: Parse an indexed expression
- **WHEN** the string `(A{^a} + B{^a}){;b}` is parsed
- **THEN** it MUST produce a JSON AST representing the covariant derivative of the sum of `A` and `B`.

#### Scenario: Parse functional operators
- **WHEN** the string `d(A ^ B)`, `L(X, T{^a _b})`, `Tr(T)`, `det(g)`, or `inv(M)` is parsed
- **THEN** it MUST produce a JSON AST representing the corresponding mathematical operator.

## ADDED Requirements

### Requirement: Symmetrization and Anti-symmetrization Syntax
The grammar SHALL support explicit symmetrization and anti-symmetrization of indices within the index block. The variance marker (`_` or `^`) MUST precede the opening bracket.

#### Scenario: Symmetrized covariant indices
- **WHEN** the string `T{_( a b _)}` is parsed
- **THEN** it MUST produce a JSON AST representing $T_{(ab)}$.

#### Scenario: Symmetrized contravariant indices
- **WHEN** the string `T{^( a b ^)}` is parsed
- **THEN** it MUST produce a JSON AST representing $T^{(ab)}$.

#### Scenario: Anti-symmetrized indices
- **WHEN** the string `T{_[ a b _]}` is parsed
- **THEN** it MUST produce a JSON AST representing $T_{[ab]}$.
