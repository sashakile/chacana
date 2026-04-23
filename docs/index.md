# Chacana

Chacana is a tensor calculus DSL and Python library for parsing tensor
expressions, checking index and operator consistency, and producing a
MathJSON-style AST.

This documentation is for readers who want to use the Python package, define
TOML tensor contexts, explore the language syntax, or integrate Chacana into
editor and browser tooling.

## Start here

If you are new to Chacana, use this path:

1. Read [Installation](getting-started/installation.md)
2. Follow [Quick Start](getting-started/quickstart.md) for one complete runnable example
3. Use the [User Guide](guide/expressions.md) when you need syntax, context, or checker details
4. Use the [API Reference](api/index.md) for Python package details
5. Try the [Playground](playground.md) for browser-based exploration

## What Chacana gives you

- **PEG Grammar** -- deterministic parsing of tensor expressions with Arpeggio
- **Static Type Checking** -- contraction consistency, free index invariance, symmetry validation
- **MathJSON Output** -- spec-compliant `ValidationToken` AST format
- **TOML Context** -- declare manifolds, tensors, metrics, and strategies
- **Differential Geometry** -- type-checked exterior derivatives, Lie derivatives, Hodge star, trace, determinant, inverse
- **Unicode Support** -- Greek indices with NFC normalization and visual spoofing rejection
- **Tree-sitter Grammar** -- incremental parsing, syntax highlighting, and real-time validation queries for IDE integration ([try the playground](playground.md))
- **`.chcn` file extension** -- canonical extension for Chacana expression files

## Quick Example

This is the whole game in miniature: load a context, parse a valid tensor
expression, and expect invalid expressions to raise type errors.

```python
import chacana

# Load a TOML context declaring manifolds and tensors
ctx = chacana.load_context("examples/basic.toml")

# Parse and type-check a Riemann tensor expression
result = chacana.parse("R{^a _b _c _d}", context=ctx)
# {'type': 'TensorExpression', 'head': 'R', 'indices': [...]}

# Invalid expressions raise clear errors
chacana.parse("A{^a} + B{_a}", context=ctx)
# ChacanaTypeError: Free index mismatch in sum
```

## Implementation pipeline overview

```
Expression String
    │
    ▼
normalize_input()     ← Unicode NFC + scope check
    │
    ▼
parse_and_validate()  ← Arpeggio PEG parser + nested sym rejection
    │
    ▼
parse_to_ast()        ← Visitor: parse tree → ValidationToken
    │
    ▼
check()               ← Static type checker (Rules 1-3 + operators)
    │
    ▼
ValidationToken.to_dict()  → MathJSON dict
```
