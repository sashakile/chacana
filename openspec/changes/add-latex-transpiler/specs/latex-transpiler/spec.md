# Specification: LaTeX Transpiler

## Purpose
The LaTeX Transpiler provides bidirectional conversion between the Chacana `ValidationToken` AST and LaTeX mathematical notation. This enables publication-quality rendering of tensor expressions and allows importing expressions from existing LaTeX documents.

## ADDED Requirements

### Requirement: AST to LaTeX Transformation (toLatex)
The transpiler SHALL correctly transform a `ValidationToken` AST into a valid LaTeX string.

#### Scenario: Transform standard Riemann tensor
- **GIVEN** an AST for `R{^a _b _c _d}`
- **WHEN** `toLatex` is called
- **THEN** it MUST return `R^{a}{}_{b c d}` (or equivalent canonical LaTeX).

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
- **THEN** it MUST return `T_{a ;\! b}` (using `;\!` for thin negative spacing after the semicolon).

#### Scenario: Transform nested functional operators
- **GIVEN** an AST for `d(star(omega))`
- **WHEN** `toLatex` is called
- **THEN** it MUST use scaled delimiters, returning `d \left( \star \left( \omega \right) \right)`.

### Requirement: Supported LaTeX Operator Mapping
The transpiler SHALL support a core set of LaTeX commands for bidirectional transformation.

| Operator | Chacana | LaTeX |
| :--- | :--- | :--- |
| Addition | `+` | `+` |
| Subtraction | `-` | `-` |
| Multiplication | `*` | `\cdot`, `\times`, or implicit |
| Wedge Product | `^` | `\wedge` |
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
The transpiler SHALL provide a basic mechanism to convert common LaTeX tensor notation back into Chacana micro-syntax.

#### Scenario: Import basic tensor notation
- **GIVEN** the LaTeX string `R_{abc}^d`
- **WHEN** `fromLatex` is called
- **THEN** it MUST return `R{^d _a _b _c}`.

#### Scenario: Import basic arithmetic
- **GIVEN** the LaTeX string `A + B \cdot C`
- **WHEN** `fromLatex` is called
- **THEN** it MUST return `A + B * C`.

### Requirement: Playground Integration
The Web Playground SHALL display the LaTeX rendering of the current expression in real-time.

#### Scenario: Display rendered expression
- **GIVEN** a valid Chacana expression in the playground
- **WHEN** the input is updated
- **THEN** the playground MUST call `toLatex` and render the result using KaTeX.

#### Scenario: Import from LaTeX UI
- **GIVEN** a LaTeX string in the import field
- **WHEN** the "Import" button is clicked
- **THEN** the main expression input MUST be populated with the converted Chacana syntax.
