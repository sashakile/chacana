# Quick Start

## Parse a tensor expression

```python
import chacana

result = chacana.parse("R{^a _b _c _d}")
print(result)
```

Output:

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

## Use a TOML context for type checking

Create a TOML file declaring your manifold and tensors:

```toml
# basic.toml
[manifold.M]
dimension = 4
index_type = "Latin"

[tensor.R]
manifold = "M"
rank = 4
index_pattern = ["Contra", "Covar", "Covar", "Covar"]

[tensor.A]
manifold = "M"
rank = 1
index_pattern = ["Contra"]

[tensor.B]
manifold = "M"
rank = 1
index_pattern = ["Contra"]
```

Then load it and parse with type checking:

```python
import chacana

ctx = chacana.load_context("basic.toml")

# Valid: matching free indices in sum
chacana.parse("A{^a} + B{^a}", context=ctx)

# Invalid: mismatched variance in sum
chacana.parse("A{^a} + B{_a}", context=ctx)
# raises ChacanaTypeError: Free index mismatch in sum
```

## Handle errors

```python
from chacana import ChacanaParseError, ChacanaTypeError

try:
    chacana.parse("R{?a}")
except ChacanaParseError as e:
    print(f"Syntax error: {e}")

try:
    chacana.parse("A{^a} + B{_a}", context=ctx)
except ChacanaTypeError as e:
    print(f"Type error: {e}")
```
