# Specification: Chacana PEG Grammar

## Purpose
This specification defines the formal **Parsing Expression Grammar (PEG)** for the Chacana micro-syntax. The grammar is used by Chacana Processors to transform expression strings into a canonical JSON AST for use in both symbolic and numerical engines.

## Requirements

### Requirement: Deterministic Parsing
The PEG grammar SHALL provide a deterministic way to parse tensor expressions into a structured Abstract Syntax Tree (AST).

#### Scenario: Parse a standard tensor expression
- **WHEN** the string `R{^a _b _c _d}` is parsed
- **THEN** it MUST produce a JSON AST representing a tensor `R` with four specified indices.

### Requirement: Index Variance Recognition
The grammar SHALL correctly identify and parse index variance (upper and lower indices).

#### Scenario: Parse an upper and lower index pair
- **WHEN** an index pair like `^a _b` is parsed
- **THEN** it MUST correctly identify `^` as contravariant and `_` as covariant.

## Design Details

### 1. Lexical Tokens
Defines basic patterns for identifiers, integers, floats, and whitespace.

### 2. Grammar Rules (PEG)
Provides the formal grammar, including:
- **Sum**: Addition and subtraction (lowest precedence).
- **Product**: Multiplication and wedge product.
- **Factor**: Core tensor expressions, commutators, perturbations, scalars, and parenthesized expressions.
- **Index List**: Mandatory whitespace between indices.
- **Index Rules**: Variance markers (`^`, `_`) and derivative markers (`;`, `,`).

### 3. Operator Precedence
Defines the hierarchy from index attachment (highest) to addition/subtraction (lowest).

### 4. Implementation Notes for Processors
- **Rational Reduction**: Processors MUST reduce rational coefficients.
- **Left-to-Right Derivatives**: Interprets `T{;a ;b}` as $\nabla_b (\nabla_a T)$.
- **Wedge Normalization**: Processors MUST apply the $1/(p!q!)$ normalization factor.
- **Static Type Checking**: The parsed AST must be validated by the Chacana Static Checker.
