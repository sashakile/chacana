# Specification: LaTeX Transpiler

## Purpose
The LaTeX Transpiler provides bidirectional conversion between the Chacana `ValidationToken` AST and LaTeX mathematical notation. This enables publication-quality rendering of tensor expressions and allows importing expressions from existing LaTeX documents.

## ADDED Requirements

### Requirement: AST to LaTeX Transformation (toLatex)
The transpiler SHALL correctly transform a `ValidationToken` AST into a valid LaTeX string.

#### Scenario: Transform scalar identifier
- **GIVEN** an AST for a scalar token with head `x` and no indices
- **WHEN** `toLatex` is called
- **THEN** it MUST return `x`.

#### Scenario: Transform numeric coefficient
- **GIVEN** an AST for `2 * T{^a _b}`
- **WHEN** `toLatex` is called
- **THEN** it MUST return `2 T^{a}{}_{b}`.

#### Scenario: Transform standard Riemann tensor
- **GIVEN** an AST for `R{^a _b _c _d}`
- **WHEN** `toLatex` is called
- **THEN** it MUST return `R^{a}{}_{b c d}`.

#### Scenario: Transform Greek indices
- **GIVEN** an AST for `T{^α _β}`
- **WHEN** `toLatex` is called
- **THEN** it MUST return `T^{\alpha}{}_{\beta}`.

#### Scenario: Transform geometric operators
- **GIVEN** an AST for `L(X, g{_a _b})` (Lie derivative)
- **WHEN** `toLatex` is called
- **THEN** it MUST return `\mathcal{L}_{X} g_{a b}`.

#### Scenario: Transform algebraic operators
- **GIVEN** an AST for `det(g{_a _b})`
- **WHEN** `toLatex` is called
- **THEN** it MUST return `\det(g_{a b})`.

#### Scenario: Transform covariant derivatives
- **GIVEN** an AST for `T{_a ;b}`
- **WHEN** `toLatex` is called
- **THEN** it MUST return `T_{a ;\! b}`.

#### Scenario: Transform negation
- **GIVEN** an AST for `-T{^a _b}`
- **WHEN** `toLatex` is called
- **THEN** it MUST return `-T^{a}{}_{b}`.

#### Scenario: Transform nested functional operators
- **GIVEN** an AST for `d(star(omega))`
- **WHEN** `toLatex` is called
- **THEN** it MUST return `d(\star(\omega))`.

#### Scenario: Transform symmetrized indices
- **GIVEN** an AST for `T{_(a _b)}` with symmetrization metadata
- **WHEN** `toLatex` is called
- **THEN** it MUST return `T_{(a b)}`.

#### Scenario: Transform antisymmetrized indices
- **GIVEN** an AST for `T{_[a _b]}` with antisymmetrization metadata
- **WHEN** `toLatex` is called
- **THEN** it MUST return `T_{[a b]}`.

### Requirement: Supported LaTeX Operator Mapping
The transpiler SHALL support a core set of LaTeX commands for bidirectional transformation.

| Operator | Chacana | LaTeX |
| :--- | :--- | :--- |
| Addition | `+` | `+` |
| Negation | `-` (prefix) | `-` |
| Subtraction | `-` | `-` |
| Multiplication | `*` | `\cdot`, `\times`, or implicit |
| Wedge Product | `∧` (wedge infix) | `\wedge` |
| Exterior Deriv. | `d` | `d` |
| Lie Derivative | `L` | `\mathcal{L}` |
| Hodge Star | `star`/`hodge` | `\star` |
| Interior Product| `i` | `i` or `\iota` |
| Determinant | `det` | `\det` |
| Trace | `Tr` | `\operatorname{Tr}` |
| Inverse | `inv` | `^{-1}` |

#### Scenario: Verify operator mapping coverage
- **GIVEN** an expression using all supported operators
- **WHEN** the transpiler processes the expression
- **THEN** it MUST use the canonical LaTeX representation specified in the mapping table.

### Requirement: LaTeX to Chacana Transformation (fromLatex)
The transpiler SHALL provide a basic mechanism to convert common LaTeX tensor notation back into Chacana micro-syntax, preserving the positional order of indices as they appear in the LaTeX source.

#### Scenario: Import basic tensor notation
- **GIVEN** the LaTeX string `R_{abc}^{d}`
- **WHEN** `fromLatex` is called
- **THEN** it MUST return `R{_a _b _c ^d}` (preserving positional order).

#### Scenario: Import basic arithmetic
- **GIVEN** the LaTeX string `A + B \cdot C`
- **WHEN** `fromLatex` is called
- **THEN** it MUST return `A + B * C`.

#### Scenario: Handle unsupported LaTeX input
- **GIVEN** a LaTeX string containing unsupported constructs (e.g., `\frac{1}{2} R_{abcd}`)
- **WHEN** `fromLatex` is called
- **THEN** it MUST return an error result describing the unsupported construct, along with any successfully parsed portion.

### Requirement: Playground Integration
The Web Playground SHALL display a rendered mathematical representation of the current expression in real-time.

#### Scenario: Display rendered expression
- **GIVEN** a valid Chacana expression in the playground
- **WHEN** the input is updated
- **THEN** the playground MUST call `toLatex` and render the result as formatted mathematical notation.

#### Scenario: Import from LaTeX UI
- **GIVEN** a LaTeX string in the import field
- **WHEN** the "Import" button is clicked
- **THEN** the main expression input MUST be populated with the converted Chacana syntax.
