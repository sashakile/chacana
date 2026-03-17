# Specification: Chacana Tree-sitter Grammar

## Purpose
This specification defines the **Tree-sitter grammar** for the Chacana micro-syntax, providing the foundation for IDE integration, incremental parsing, and high-speed static validation. It is optimized for editor tooling (LSP), real-time diagnostics, and semantic analysis.
## Requirements
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

## Design Details

### 1. Design Goals
- Incremental parsing.
- Error recovery.
- Static analysis.
- Language portability.

### 2. Grammar Implementation (`grammar.js`)
- **Precedence Mapping**: Mirrored from the PEG specification (1 to 7).
- **Rules**: Sum, Product, Wedge, Factor, Unary, Parenthesized, Exterior operators, Commutators, Perturbations, and Tensor Expressions.
- **Index List**: Whitespace between indices is explicitly enforced.

### 3. Static Validation Queries (`queries/validation.scm`)
S-expression queries for:
- Index label extraction.
- Covariant derivative identification.
- Illegal contraction detection (matching label and variance).

### 4. Implementation Strategy for "Chacana Checker"
The Chacana Static Checker uses a three-stage validation:
1.  **Syntactic Pass (Tree-sitter)**: Brackets and operators.
2.  **Internal Consistency Pass (Bridge Mechanism)**: Variance and contraction rules.
3.  **Semantic Context Pass (TOML-bound)**: Registry and rank verification.
