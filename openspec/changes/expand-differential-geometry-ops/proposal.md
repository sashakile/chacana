# Change: Expand Differential Geometry Operations in Chacana DSL

## Why
The current Chacana DSL and AST are restricted to basic tensor algebra on single tensors. To support realistic general relativity and differential geometry workflows (e.g., Einstein equations, symmetry analysis), the language must support operations on expressions (like derivatives of sums), exterior calculus (d, Hodge star, Lie derivatives), and explicit symmetrization.

## What Changes
- **Refactor Grammar to allow Indexing of Expressions**: Change `tensor_expr` to allow attaching indices/derivatives to parenthesized expressions. **BREAKING**
- **Add Exterior Calculus Operators**: Support for `d()` (exterior derivative), `*( )` (Hodge star), and `i( , )` (interior product).
- **Add Lie Derivative**: Support for `L( , )` operator.
- **Add Symmetrization Syntax**: Support for `_(` and `_)` (symmetrization) and `_[ ` and `_]` (anti-symmetrization) within index lists, supporting both covariant and contravariant markers.
- **Add Algebraic Operators**: Support for `Tr()`, `det()`, and `inv()`.
- **Update Static Type System**: Define typing rules for these new operators (e.g., `d` increases form degree, `L` preserves tensor type) and enforce variance matching for explicit symmetrization.

## Impact
- Affected specs: `peg-grammar`, `dsl-specification`, `treesitter-grammar`, `differential-geometry`.
- Affected code: Parser (Python/Arpeggio), Tree-sitter grammar, Static Checker.
