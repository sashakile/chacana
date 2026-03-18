# Type Checking

Chacana's static type checker validates tensor expressions against three rules
from the specification, plus rank checking and operator constraints.

## Rule 1: Contraction Consistency

A contraction (repeated index in a product) requires:

1. **Same label** -- the index name must match
2. **Same index type** -- both must be Latin, both Greek, etc.
3. **Opposite variance** -- one contravariant, one covariant

```python
# Valid contraction: same label, same type, opposite variance
chacana.parse("A{_a} * B{^a}", context=ctx)

# Invalid: same variance without metric
chacana.parse("A{_a} * B{_a}", context=ctx)
# ChacanaTypeError: Contraction index 'a' appears twice with same variance

# Invalid: mismatched index type (Latin vs Greek)
# ChacanaTypeError: Contraction index 'a' has mismatched index type
```

### Metric-aware contraction

When the context has `active_metric` set, same-variance contraction is permitted:

```toml
[strategy]
active_metric = "g"
```

```python
# Now allowed: metric handles the index raising/lowering
chacana.parse("A{_a} * B{_a}", context=ctx)
```

## Rule 2: Free Index Invariance

All terms in a sum must have the same free (uncontracted) indices:

```python
# Valid: both terms have free index ^a
chacana.parse("A{^a} + B{^a}", context=ctx)

# Invalid: first term has ^a, second has _a
chacana.parse("A{^a} + B{_a}", context=ctx)
# ChacanaTypeError: Free index mismatch in sum
```

## Rule 3: Symmetry Validity

Indices in symmetrized groups must have matching variance and index type.
This applies to both explicit symmetrization in expressions and declared
symmetries in the TOML context.

## Rank checking

When a context is provided, the checker validates that tensor usage matches
the declared rank and index pattern:

```python
# If R is declared rank 4 with pattern [Contra, Covar, Covar, Covar]:
chacana.parse("R{^a _b _c _d}", context=ctx)  # Valid
chacana.parse("R{^a _b}", context=ctx)         # ChacanaTypeError: rank mismatch
```

## Using the checker directly

```python
from chacana.checker import check
from chacana.grammar import create_parser, normalize_input, parse_and_validate
from chacana.visitor import parse_to_ast

expr = normalize_input("R{^a _b _c _d}")
tree = parse_and_validate(expr)
token = parse_to_ast(tree)

# Check without context (only Rules 1 & 2)
check(token)

# Check with context (all rules + rank + operators)
check(token, ctx)
```
