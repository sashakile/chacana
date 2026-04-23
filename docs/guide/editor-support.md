# Editor Support

Chacana supports two editor-integration paths:

- use the VS Code extension when you want LSP features such as diagnostics, hover, and go-to-definition
- use the tree-sitter grammar directly when you want syntax highlighting and incremental parsing in other editors

## TL;DR

Use this page if you want to decide which editor path to use and how Chacana finds its TOML context.

| Need | Best path |
|---|---|
| Full language features in VS Code | VS Code extension + bundled LSP |
| Syntax highlighting in another editor | `tree-sitter-chacana/` grammar |
| Browser-only experimentation | [Playground](../playground.md) |

## Support matrix

| Editor/tool | Syntax highlighting | Diagnostics | Hover / go-to-definition | Setup path |
|---|---|---|---|---|
| VS Code extension | Yes | Yes | Yes | Build/install `vscode-chacana` |
| Neovim / Helix / Zed via tree-sitter | Yes | Limited to what you wire up yourself | No built-in LSP from this repo | Use `tree-sitter-chacana/` |
| Playground | Yes | Yes | No | Open the browser page |

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

### What the VS Code extension gives you

| Capability | What it does |
|---|---|
| Syntax highlighting | Highlights tensors, indices, variance markers, operators, and functional operators |
| Real-time syntax diagnostics | Flags malformed expressions and invalid characters as you type |
| Type checking | Runs the Chacana checker when the expression is syntactically valid |
| Hover | Shows tensor declarations and operator help |
| Go-to-definition | Jumps from a tensor use to its TOML declaration |

### Diagnostic layers

As you type, the LSP server provides two layers of diagnostics:

1. **Syntax errors** — via tree-sitter incremental parsing. Unclosed braces,
   invalid characters, and malformed expressions are flagged instantly.
2. **Type checking** — when the expression is syntactically valid, the full
   Chacana type checker runs for contraction consistency, free-index invariance,
   symmetry validity, rank checking, and operator constraints.

### Hover examples

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

### Go-to-definition

`Ctrl+Click` (or `F12`) on a tensor name jumps to its `[tensor.X]`
declaration in the TOML context file.

### Context resolution

The LSP needs a TOML context file for rank checking and operator validation.
It resolves the context in this order:

1. **Directive in the source file**
   ```
   # context: path/to/context.toml
   R{^a _b _c _d}
   ```
2. **Sibling discovery** — walk up from the `.chcn` file's directory looking for `chacana.toml`

### What works without a context

Without a context, the LSP still provides:

- syntax errors
- contraction checks
- free-index invariance checks

Without a context, the LSP cannot fully validate:

- rank declarations
- declared tensor index patterns
- operator requirements that depend on tensor shape or `active_metric`

## Other editors via tree-sitter

The tree-sitter grammar (`tree-sitter-chacana/`) works natively in:

- **Neovim** — add `tree-sitter-chacana` to your tree-sitter config
- **Helix** — place the grammar in your runtime directory
- **Zed** — supports tree-sitter grammars directly

For these editors, start with:

- `tree-sitter-chacana/queries/highlights.scm` for syntax highlighting
- `tree-sitter-chacana/queries/validation.scm` for index extraction and variance consistency queries

These integrations give you the grammar and queries, not the full VS Code LSP experience from this repository.

## Online Playground

Try the [Playground](../playground.md) to parse and type-check expressions
in your browser — no installation needed.
