# Chacana

Chacana is a tensor calculus DSL with static type checking. It parses tensor
expressions into a MathJSON-style AST and validates index consistency, rank,
symmetry, and differential geometry operator constraints.

## Features

- **PEG Grammar** -- deterministic parsing of tensor expressions with Arpeggio
- **Static Type Checking** -- contraction consistency, free index invariance, symmetry validation
- **MathJSON Output** -- spec-compliant `ValidationToken` AST format
- **TOML Context** -- declare manifolds, tensors, metrics, and strategies
- **Differential Geometry** -- type-checked exterior derivatives, Lie derivatives, Hodge star, trace, determinant, inverse
- **Unicode Support** -- Greek indices with NFC normalization and visual spoofing rejection

## Quick Example

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

## Architecture

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
