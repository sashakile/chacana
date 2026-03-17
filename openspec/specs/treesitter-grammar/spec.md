---
change-id: CHG-2026-03-17-005
version: 0.1.0
status: DRAFT
---
# Specification: Chacana Tree-sitter Grammar

## Purpose
This specification defines the **Tree-sitter grammar** for the Chacana micro-syntax, providing the foundation for IDE integration, incremental parsing, and static validation. It is optimized for editor tooling (LSP), real-time diagnostics, and semantic analysis.

## Requirements

### Requirement: Incremental Parsing
The Tree-sitter grammar SHALL support incremental parsing to efficiently re-parse large tensor expressions as they are edited. It MUST support the recursive indexing structure for expressions and functional operators.

#### Scenario: Edit a complex tensor product
- **GIVEN** a large tensor expression AST
- **WHEN** an index is changed in a nested expression
- **THEN** only the affected branch of the syntax tree MUST be re-parsed.

#### Scenario: Handle partial input during editing
- **GIVEN** an active editor session
- **WHEN** an expression is partially typed (e.g., `R{^a _`)
- **THEN** the Tree-sitter parser MUST provide an error recovery node and continue parsing the rest of the file.

### Requirement: Real-time Index Validation Queries
The grammar SHALL support S-expression queries for real-time validation of tensor indices, including variance matching in explicit symmetrization blocks.

#### Scenario: Identify illegal symmetrization in real-time
- **GIVEN** a Tree-sitter validation query
- **WHEN** a symmetrization block with mixed variance is typed (e.g., `T{_( a ^b _)}`)
- **THEN** the query MUST identify the `variance_mismatch` node for diagnostic highlighting.

#### Scenario: Detect invalid index types
- **GIVEN** a Global Context Γ defining index types
- **WHEN** an index of an undeclared type is used
- **THEN** a Tree-sitter query MUST be able to flag the identifier for semantic validation.

## Design Details

### 1. Design Goals
- **Incremental parsing**: Minimum re-parse time for large buffers.
- **Error recovery**: Robust handling of malformed snippets during live typing.
- **Static analysis**: Enabling LSP features like "Go to Definition" for tensors.
- **Language portability**: Generating C-based parsers for use in multiple host languages.

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
