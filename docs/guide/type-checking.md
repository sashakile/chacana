# Type Checking

Chacana's static type checker validates tensor expressions against three rules
from the specification, plus rank checking and operator constraints.

## Rule 1: Contraction Consistency

This page is most useful when you already have a context and want to understand why a parse succeeded or failed.

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

## Common type-checking failures

| Error shape | Likely cause | Example that fails | How to fix |
|---|---|---|---|
| `Contraction index 'a' appears twice with same variance` | You repeated an index label in a product without opposite variance | `A{_a} * B{_a}` | Change one index to the opposite variance, or configure `active_metric` if metric-aware contraction is intended |
| `Contraction index 'a' has mismatched index type` | The same contraction label is used across incompatible index types | A Latin index contracts with a Greek index of the same label | Make both slots use the same index type and variance pattern |
| `Free index mismatch in sum: term 0 has {^a}, term 1 has {_a}` | Terms in a sum expose different free indices | `A{^a} + B{_a}` | Make every term in the sum expose the same free indices |
| `Variance mismatch in symmetrization ...` | A symmetrized group mixes upper and lower indices | A symmetrized group that combines contravariant and covariant slots | Keep every index in the same symmetrized group at the same variance |
| `Tensor 'R' declared with rank 4, but used with 2 indices` | Tensor usage does not match the context declaration | `R{^a _b}` when `R` is rank 4 in the context | Supply the declared number of intrinsic indices |
| `Tensor 'T' index 0: expected Contra, got Covar` | The variance in use does not match the declared `index_pattern` | `T{_a}` when the first slot is declared `Contra` | Change the expression to match the context, or update the context if the declaration is wrong |

## Rank checking

When a context is provided, the checker validates that tensor usage matches
the declared rank and index pattern:

```python
# If R is declared rank 4 with pattern [Contra, Covar, Covar, Covar]:
chacana.parse("R{^a _b _c _d}", context=ctx)  # Valid
chacana.parse("R{^a _b}", context=ctx)         # ChacanaTypeError: rank mismatch
```

## Minimal debugging checklist

When an expression fails type checking:

1. Confirm the tensor names and ranks in your TOML context
2. Check whether repeated labels are supposed to contract or stay free
3. Compare the free indices in every term of a sum
4. Verify each tensor slot matches the declared `index_pattern`
5. Re-run the expression with the smallest possible failing example

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
