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

### Requirement: Unicode Normalization and Scope
The parser SHALL ensure that the entire expression string is normalized to prevent false mismatches. 

#### Scenario: Normalize precomposed vs decomposed characters
- **WHEN** an identifier or index name contains a character like `Ḃ`
- **THEN** it MUST be normalized to UTF-8 NFC (Normalization Form C) before processing.
- **AND** index names MUST be restricted to the `Basic Latin` and `Greek and Coptic` Unicode blocks to prevent visual spoofing (e.g., mixing Latin 'a' and Cyrillic 'а').

### Requirement: Canonical Rational Representation
The parser SHALL ensure that rational numbers have a canonical representation.

#### Scenario: Normalize rational sign
- **WHEN** a rational number with a negative denominator is parsed (e.g., `1 / -2`)
- **THEN** the sign MUST be hoisted to the numerator (e.g., `-1 / 2`) during the reduction pass.

## Design Details

### 1. Lexical Tokens
Defines basic patterns for identifiers, integers, floats, and whitespace.

### 2. Grammar Rules (PEG Production Rules)

```peg
# Chacana PEG Grammar v0.2.4

expression = sum
sum        = product ( (PLUS / MINUS) product )*
product    = wedge ( STAR wedge )*
wedge      = factor ( WEDGE factor )*

factor     = tensor_expr 
           / scalar 
           / perturbation 
           / commutator 
           / LPAREN expression RPAREN

tensor_expr = identifier (LBRACE index_list RBRACE)?
index_list  = index (whitespace index)*
index       = variance? (identifier / derivative)
variance    = CONTRA / COVAR
derivative  = (SEMICOLON / COMMA) identifier

perturbation = AT integer LPAREN expression RPAREN
commutator   = LBRACK expression COMMA expression RBRACK

identifier  = [a-zA-Z\u0370-\u03FF][a-zA-Z0-9\u0370-\u03FF]*
integer     = [0-9]+
scalar      = float / integer

PLUS      = "+"
MINUS     = "-"
STAR      = "*"
WEDGE     = "^"
AT        = "@"
LBRACE    = "{"
RBRACE    = "}"
LBRACK    = "["
RBRACK    = "]"
LPAREN    = "("
RPAREN    = ")"
CONTRA    = "^"
COVAR     = "_"
SEMICOLON = ";"
COMMA     = ","
whitespace = [ \t\n\r]+
```

### 3. Operator Precedence
Defines the hierarchy from index attachment (highest) to addition/subtraction (lowest).

### 4. Implementation Notes for Processors
- **Rational Reduction**: Processors MUST reduce rational coefficients.
- **Left-to-Right Derivatives**: Interprets `T{;a ;b}` as $\nabla_b (\nabla_a T)$.
- **Wedge Normalization**: Processors MUST apply the $1/(p!q!)$ normalization factor.
- **Static Type Checking**: The parsed AST must be validated by the Chacana Static Checker.
