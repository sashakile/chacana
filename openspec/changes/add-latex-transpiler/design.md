# Design: LaTeX Transpiler

## Context
Chacana uses a MathJSON-compatible `ValidationToken` AST. This design defines the mapping from this AST to LaTeX and the reverse mapping from standard LaTeX tensor notation to Chacana micro-syntax.

## Goals
- Precise LaTeX rendering of tensor indices (preserving variance alignment).
- Correct mapping of geometric and algebraic operators.
- Support for Greek characters as `\alpha`, `\beta`, etc.
- Robust import of standard LaTeX tensor strings.

## Non-Goals
- Supporting arbitrary LaTeX math (e.g., `\frac`, matrix environments, `\sqrt`).
- Python `to_latex` implementation (separate follow-up).

## Decisions

### 1. `toLatex` Index Alignment and Ordering
To ensure precise mathematical notation, the horizontal order of indices in the `ValidationToken` SHALL be preserved. In tensors with mixed variance, `toLatex` will emit alternating superscript and subscript blocks with empty curly braces as placeholders for non-active slots at that horizontal position.

**Definitions:**
- **Staggered indices**: Indices alternate between super/subscript positions, e.g., `R^a{}_b{}^c{}_d`.
- **Stacked indices**: Indices are grouped by variance, e.g., `R^{ac}{}_{bd}`.

`toLatex` always emits staggered form to preserve positional semantics.

**Example**: $R^a{}_b{}^c{}_d$ is represented in the AST as a sequence $[a^\uparrow, b_\downarrow, c^\uparrow, d_\downarrow]$ and SHOULD be emitted as `R^{a}{}_{b}{}^{c}{}_{d}`.

### 2. Greek Character Mapping
The transpiler SHALL maintain a bidirectional mapping for all Unicode Greek characters defined in the core grammar (U+0370-03FF).
- **Lower Case**: `α` <-> `\alpha`, `β` <-> `\beta`, etc.
- **Upper Case**: `Γ` <-> `\Gamma`, `Δ` <-> `\Delta`, etc.
- **Variant Forms**: Standard variants like `\varepsilon` and `\varphi` SHOULD be supported where appropriate for common physics notation.

### 3. `fromLatex` Strategy and Heuristics

#### Index Ordering Convention
`fromLatex` SHALL preserve the positional (left-to-right) order of indices as they appear in the LaTeX source. It does NOT reorder indices by variance. For example, `R_{abc}^{d}` produces `R{_a _b _c ^d}`, not `R{^d _a _b _c}`.

#### Identifier Identification
A single letter (Latin or Greek, including LaTeX commands like `\alpha`) followed immediately by `_` or `^` will be treated as a tensor name. Multi-character LaTeX structural commands (`\frac`, `\sqrt`, `\sum`, `\int`, `\prod`, `\lim`) are excluded from tensor name detection. Isolated identifiers without subscripts or superscripts will be treated as scalars or coordinate identifiers.

#### Unicode Support
`fromLatex` MUST handle both literal Unicode Greek (e.g., `α`) and LaTeX commands (e.g., `\alpha`) equivalently.

#### Operator Normalization
Common LaTeX synonyms (e.g., `\cdot`, `\times`, `*`) will be normalized to the Chacana equivalent (`*`).

#### Delimiter Scaling
Scaled delimiters like `\left(` and `\right)` will be stripped and treated as standard parentheses for AST construction.

### 4. Rendering Tooling
The playground will use **KaTeX** (via CDN) for client-side LaTeX rendering. This is a tooling choice, not a specification requirement.

### 5. Error Handling for `fromLatex`
When `fromLatex` encounters unsupported or malformed LaTeX input, it SHALL return an error result (not throw). The error result includes:
- The portion of the input that was successfully parsed (if any).
- A description of the unsupported construct or parse failure.

This enables best-effort partial results while signaling to the caller that the input was not fully consumed.

## Risks / Trade-offs
- **Complex LaTeX Dialects**: LaTeX is highly customizable; `fromLatex` will initially support only standard `\tensor_{indices}^{indices}` styles.
- **Ambiguity**: LaTeX indices like `R_{a,b}` could mean a partial derivative or just two indices. Chacana's explicit `,` and `;` notation will be preferred.
