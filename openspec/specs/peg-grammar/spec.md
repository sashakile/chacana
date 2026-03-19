---
change-id: CHG-2026-03-17-004
version: 1.0.0
status: STABLE
---
# Specification: Chacana PEG Grammar

## Purpose
This specification defines the formal **Parsing Expression Grammar (PEG)** for the Chacana micro-syntax. The grammar is used by Chacana Processors to transform expression strings into a canonical JSON AST for use in both symbolic and numerical engines.

## Requirements

### Requirement: Deterministic Parsing
The PEG grammar SHALL provide a deterministic way to parse tensor expressions into a structured Abstract Syntax Tree (AST). It MUST support recursive indexing on parenthesized expressions and functional operators for algebra and geometry.

#### Scenario: Parse a standard tensor expression
- **WHEN** the string `R{^a _b _c _d}` is parsed
- **THEN** it MUST produce a JSON AST representing a tensor `R` with four specified indices.

#### Scenario: Parse functional operators
- **WHEN** the string `d(A ^ B)`, `L(X, T{^a _b})`, `Tr(T)`, `det(g)`, `inv(M)`, `star(F)`, `hodge(F)`, or `i(X, omega)` is parsed
- **THEN** it MUST produce a JSON AST representing the corresponding mathematical operator.

#### Scenario: Parse functional operator with index attachment
- **WHEN** the string `d(omega){_a _b}` is parsed
- **THEN** it MUST produce a JSON AST representing the exterior derivative of `omega` with covariant indices `a` and `b` attached to the result.

#### Scenario: Reject malformed operator syntax
- **WHEN** the string `d(A ^ )` is parsed (missing operand)
- **THEN** the parser MUST return a syntax error indicating the expected expression.

### Requirement: Index Variance Recognition
The grammar SHALL correctly identify and parse index variance (upper and lower indices).

#### Scenario: Parse an upper and lower index pair
- **WHEN** an index pair like `^a _b` is parsed
- **THEN** it MUST correctly identify `^` as contravariant and `_` as covariant.

#### Scenario: Reject invalid variance marker
- **WHEN** an index like `?a` is parsed
- **THEN** the parser MUST reject the expression as syntactically invalid.

### Requirement: Unicode Normalization and Scope
The parser SHALL ensure that the entire expression string is normalized to prevent false mismatches. 

#### Scenario: Normalize precomposed vs decomposed characters
- **WHEN** an identifier or index name contains a character like `Ḃ`
- **THEN** it MUST be normalized to UTF-8 NFC (Normalization Form C) before processing.

#### Scenario: Reject out-of-scope Unicode blocks
- **WHEN** an identifier contains a Cyrillic character (e.g., `а`)
- **THEN** the parser MUST reject the identifier to prevent visual spoofing.

### Requirement: Canonical Rational Representation
The parser SHALL ensure that rational numbers have a canonical representation.

#### Scenario: Normalize rational sign
- **WHEN** a rational number with a negative denominator is parsed (e.g., `1 / -2`)
- **THEN** the sign MUST be hoisted to the numerator (e.g., `-1 / 2`) during the reduction pass.

### Requirement: Symmetrization and Anti-symmetrization Syntax
The grammar SHALL support explicit symmetrization and anti-symmetrization of indices within the index block. The variance marker (`_` or `^`) MUST precede the opening bracket.

#### Scenario: Symmetrized covariant indices
- **WHEN** the string `T{_( a b _)}` is parsed
- **THEN** it MUST produce a JSON AST representing $T_{(ab)}$.

#### Scenario: Anti-symmetrized indices
- **WHEN** the string `T{_[ a b _]}` is parsed
- **THEN** it MUST produce a JSON AST representing $T_{[ab]}$.

#### Scenario: Reject nested symmetrization
- **WHEN** the string `T{_( ( a b ) _)}` is parsed
- **THEN** the parser MUST reject the expression as recursive symmetrization is not supported in the micro-syntax.

## Design Details

### 1. Lexical Tokens
Defines basic patterns for identifiers, integers, floats, and whitespace.

### 2. Grammar Rules (PEG Production Rules)

```peg
# Chacana PEG Grammar v1.0.0

expression = sum EOF
sum        = product ( (PLUS / MINUS) product )*
product    = wedge ( STAR wedge )*
wedge      = factor ( WEDGE factor )*

factor     = functional_op (LBRACE index_list RBRACE)?
           / tensor_expr
           / scalar
           / perturbation
           / commutator
           / LPAREN sum RPAREN

tensor_expr = identifier (LBRACE index_list RBRACE)?
index_list  = (symmetrization / anti_symmetrization / index)+

symmetrization      = variance LPAREN index_list variance? RPAREN
anti_symmetrization = variance LBRACK index_list variance? RBRACK

index       = variance? (derivative / identifier)
variance    = CONTRA / COVAR
derivative  = (SEMICOLON / COMMA) identifier

functional_op = identifier LPAREN (sum (COMMA sum)*)? RPAREN

perturbation = AT integer LPAREN sum RPAREN
commutator   = LBRACK sum COMMA sum RBRACK

identifier  = [a-zA-Z\u0370-\u03FF][a-zA-Z0-9\u0370-\u03FF]*
integer     = [0-9]+
scalar      = [0-9]+ ("." [0-9]+)?

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
```

### 3. Operator Precedence
Defines the hierarchy from index attachment (highest) to addition/subtraction (lowest).

### 4. Implementation Notes for Processors
- **Rational Reduction**: Processors MUST reduce rational coefficients.
- **Left-to-Right Derivatives**: Interprets `T{;a ;b}` as $\nabla_b (\nabla_a T)$.
- **Wedge Normalization**: Processors MUST apply the $1/(p!q!)$ normalization factor.
- **Static Type Checking**: The parsed AST must be validated by the Chacana Static Checker.
