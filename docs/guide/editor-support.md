# Editor Support

Chacana provides IDE integration through a VS Code extension with a bundled
Language Server Protocol (LSP) server. The extension supports `.chcn` files
with syntax highlighting, real-time diagnostics, hover info, and
go-to-definition.

## VS Code

### Installation (from source)

```bash
cd vscode-chacana
npm install
npm run build
```

Then press `F5` in VS Code to launch an Extension Development Host, or install
the built VSIX:

```bash
npx vsce package
code --install-extension vscode-chacana-0.1.0.vsix
```

### Features

#### Syntax Highlighting

The extension provides immediate syntax coloring for `.chcn` files via a
TextMate grammar. Tensors, indices, variance markers, operators, and
functional operators are all highlighted.

#### Real-time Diagnostics

As you type, the LSP server provides two layers of diagnostics:

1. **Syntax errors** — via tree-sitter incremental parsing. Unclosed braces,
   invalid characters, and malformed expressions are flagged instantly.

2. **Type checking** — when the expression is syntactically valid, the full
   Chacana type checker runs:
    - **Contraction consistency** — contracted indices must have opposite
      variance and matching index type
    - **Free index invariance** — all terms in a sum must have identical
      free indices
    - **Symmetry validity** — symmetrized groups must have matching variance
    - **Rank checking** — tensor usage must match declared rank and pattern
    - **Operator constraints** — Hodge star needs a metric, Lie derivative
      needs a vector, etc.

#### Hover

Hover over a tensor name to see its declaration from the TOML context:

```
**R** — Tensor on manifold M
- Rank: 4
- Index pattern: [Contra, Covar, Covar, Covar]
```

Hover over a functional operator to see its documentation:

```
**Exterior derivative** d(omega) — maps a p-form to a (p+1)-form
```

#### Go-to-Definition

`Ctrl+Click` (or `F12`) on a tensor name jumps to its `[tensor.X]`
declaration in the TOML context file.

### Context Resolution

The LSP needs a TOML context file for rank checking and operator validation.
It resolves the context in this order:

1. **Directive** — add a comment in the first 5 lines of your `.chcn` file:
   ```
   # context: path/to/context.toml
   R{^a _b _c _d}
   ```

2. **Sibling file** — the LSP walks up from the `.chcn` file's directory
   looking for `chacana.toml`.

Without a context, the LSP still provides syntax errors and structural
checks (contraction, free index invariance).

## Other Editors

The tree-sitter grammar (`tree-sitter-chacana/`) works natively in:

- **Neovim** — add `tree-sitter-chacana` to your tree-sitter config
- **Helix** — place the grammar in your runtime directory
- **Zed** — supports tree-sitter grammars directly

For these editors, copy the queries from `tree-sitter-chacana/queries/`:

- `highlights.scm` — syntax highlighting
- `validation.scm` — index extraction and variance consistency queries

## Online Playground

Try the [Playground](../playground.md) to parse and type-check expressions
in your browser — no installation needed.
