# Quick Start

## TL;DR

Use this page for one complete first run of Chacana.

Prerequisites:
- you completed [Installation](installation.md)
- you are running commands from the repository root
- `examples/basic.toml` is available

This walkthrough follows one canonical path:
1. verify the package import
2. load `examples/basic.toml` with `load_context_file()`
3. parse one valid expression
4. inspect the returned AST-like dict
5. see one invalid expression raise `ChacanaTypeError`

## Canonical first run

First, verify the package is importable:

```bash
# If you installed with uv
uv run python -c "import chacana; print(chacana.__version__)"

# If you installed with pip into an active environment
python -c "import chacana; print(chacana.__version__)"
```

Then run this Python example:

```python
import chacana
from chacana import ChacanaTypeError, load_context_file

ctx = load_context_file("examples/basic.toml")

# Valid: a rank-4 tensor declared in the example context
result = chacana.parse("R{^a _b _c _d}", context=ctx)
print(result)

try:
    # Invalid: free-index variance mismatch across the sum
    chacana.parse("A{^a} + B{_a}", context=ctx)
except ChacanaTypeError as exc:
    print(type(exc).__name__)
    print(exc)
```

Expected shape of the successful result:

```python
{
    'type': 'TensorExpression',
    'head': 'R',
    'indices': [
        {'label': 'a', 'variance': 'Contra', 'type': 'Latin'},
        {'label': 'b', 'variance': 'Covar', 'type': 'Latin'},
        {'label': 'c', 'variance': 'Covar', 'type': 'Latin'},
        {'label': 'd', 'variance': 'Covar', 'type': 'Latin'},
    ]
}
```

Expected failure shape:

```text
ChacanaTypeError
Free index mismatch in sum: term 0 has {^a}, term 1 has {_a}
```

## What the example context contains

`examples/basic.toml` declares the manifold and tensors used in the example, including:

- `R` as a rank-4 tensor with index pattern `Contra, Covar, Covar, Covar`
- `A` and `B` as rank-1 contravariant tensors
- additional sample tensors such as `T` and `g`

If you want to inspect or modify that context, open the repository file `examples/basic.toml`.

## Next steps

- Read [Expressions](../guide/expressions.md) for the supported syntax
- Read [TOML Context](../guide/context.md) to define your own tensors and manifolds
- Read [Type Checking](../guide/type-checking.md) for the validation rules
