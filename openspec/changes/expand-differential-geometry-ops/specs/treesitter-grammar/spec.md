## MODIFIED Requirements

### Requirement: Incremental Parsing
The Tree-sitter grammar SHALL support incremental parsing to efficiently re-parse large tensor expressions as they are edited. It MUST support the recursive indexing structure for expressions and functional operators.

#### Scenario: Edit a complex tensor product
- **WHEN** an index is changed in a large tensor product or nested expression
- **THEN** only the affected branch of the syntax tree MUST be re-parsed.

### Requirement: Real-time Index Validation Queries
The grammar SHALL support S-expression queries for real-time validation of tensor indices, including variance matching in explicit symmetrization blocks.

#### Scenario: Identify illegal symmetrization in real-time
- **WHEN** a symmetrization block with mixed variance is typed (e.g., `T{_( a ^b _)}`)
- **THEN** a Tree-sitter query MUST be able to identify and flag it as a variance mismatch error.
