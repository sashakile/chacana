# Browser LaTeX Transpiler

Bidirectional conversion between Chacana `ValidationToken` ASTs and LaTeX mathematical notation for the browser and TypeScript tooling.

!!! warning "Not part of the Python package API"
    `toLatex()` and `fromLatex()` are currently implemented in the browser/TypeScript engine (`vscode-chacana/src/server/latex.ts` and `vscode-chacana/src/browser/index.ts`). They are **not** exposed from `src/chacana/` yet, so Python users should not expect these functions in the installed `chacana` package.

Use this page when working on the playground, the browser bundle, or the VS Code extension. For the Python package API, start with [`chacana`](index.md).

## `toLatex(token)` (browser/TypeScript)

Converts a `ValidationToken` AST into a LaTeX string.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `token` | `ValidationToken` | The AST to convert |

**Returns:** `string` — a valid LaTeX representation of the expression.

**Example:**

```typescript
import { buildAST } from "chacana-checker";
import { toLatex } from "chacana-checker";

const ast = buildAST(tree.rootNode);
const latex = toLatex(ast);
// "R^{a}{}_{b c d}"
```

### Supported features

- **Index alignment**: Staggered output preserving positional order (`R^{a}{}_{b}{}^{c}{}_{d}`).
- **Greek characters**: Unicode → LaTeX commands (`α` → `\alpha`).
- **Covariant derivatives**: Semicolon notation (`T_{a ;\! b}`).
- **Symmetrization**: Parenthesized (`T_{(a b)}`) and bracketed (`T_{[a b]}`) groups.
- **Operators**: All core operators — see the [operator mapping table](#operator-mapping).

## `fromLatex(input)` (browser/TypeScript)

Converts a LaTeX string into Chacana micro-syntax.

**Parameters:**

| Name | Type | Description |
| :--- | :--- | :--- |
| `input` | `string` | LaTeX tensor expression |

**Returns:** `FromLatexResult` — a result object:

```typescript
// Success
{ ok: true, value: "R{_a _b _c ^d}" }

// Error
{ ok: false, error: "Unsupported LaTeX command: frac" }
```

**Example:**

```typescript
import { fromLatex } from "chacana-checker";

const result = fromLatex("R_{abc}^{d}");
if (result.ok) {
  console.log(result.value); // "R{_a _b _c ^d}"
}
```

### Conventions

- **Positional order preserved**: Indices appear in the same left-to-right order as the LaTeX source.
- **Greek commands converted**: `\alpha` → `α`, `\beta` → `β`, etc.
- **Operator normalization**: `\cdot` and `\times` → `*`, `\wedge` → `^`.
- **Delimiter stripping**: `\left(` and `\right)` treated as plain parentheses.
- **Unsupported constructs**: `\frac`, `\sqrt`, `\sum`, `\int`, `\prod`, `\lim` return an error result.

## Operator Mapping

| Operator | Chacana | LaTeX |
| :--- | :--- | :--- |
| Addition | `+` | `+` |
| Negation | `-` (prefix) | `-` |
| Multiplication | `*` | `\cdot` / `\times` |
| Wedge Product | `∧` (wedge infix) | `\wedge` |
| Exterior Derivative | `d` | `d` |
| Lie Derivative | `L` | `\mathcal{L}` |
| Hodge Star | `star` / `hodge` | `\star` |
| Interior Product | `i` | `\iota` |
| Determinant | `det` | `\det` |
| Trace | `Tr` | `\operatorname{Tr}` |
| Inverse | `inv` | `^{-1}` |
