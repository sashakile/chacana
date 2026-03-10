# Design: Static index type system for parse-time verification

**Date:** 2026-03-10
**Project:** chacana-spec-py
**Status:** Decided

## Context
Symbolic tensor calculus is error-prone. Mismatched index variances, illegal contractions, and symmetry violations are often only detected at runtime in current systems (like xAct), leading to slow debugging cycles.

## Decision: Static Typing Judgments
Chacana implements a **Static Type System** to validate expressions at parse-time. Every expression `E` must satisfy the following five **Typing Judgments** to be considered well-formed:

1. **Contraction Consistency**: A pair of indices `(a, b)` is contractible only if their names and `index_type` match.
    - **Metric-Aware**: If a metric is defined, same-variance contraction (`_a _a`) is permitted (implying metric contraction).
    - **Strict**: Otherwise, indices must have opposite variance (`^a _a`).
2. **Free Index Invariance**: In a sum `A + B`, the set of free indices of `A` must be identical to the set of free indices of `B` in name, variance, and type.
3. **Symmetry Validity**: Any permutation applied to a tensor must be a valid member of its declared symmetry group.
4. **Derivative Compatibility**: A derivative index `;c` must have a type compatible with the connection type associated with the operand's manifold.
5. **Perturbation Type Safety**: Higher-order perturbations (e.g., `h@1`) must share the same `index_type` and `manifold` as the background tensor.

## Decision: Pluggable Backend Adapters
The static checker performs verification against the **Global Context (Γ)** (defined in TOML). Once validated, the AST is handed off to a **Processor Backend** for execution.

## Rationale
By shifting verification to the parsing phase, we eliminate entire classes of mathematical errors before they reach the computation engine. This "fail-fast" approach ensures that the orchestrator (Eleguá) only compares mathematically valid expressions.

## Consequences
- **Positive**: Significantly faster debugging; mathematically rigorous verification.
- **Negative**: Adds complexity to the parser and requires a formal `Global Context` to be loaded before any expression can be parsed.
- **Dependency**: Requires the `openspec/specs/dsl-specification/` to be formally codified.
