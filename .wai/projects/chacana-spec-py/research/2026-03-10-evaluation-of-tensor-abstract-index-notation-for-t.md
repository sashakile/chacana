# Research: Evaluation of tensor abstract index notation for PEG grammar

**Date:** 2026-03-10
**Project:** chacana-spec-py
**Status:** Completed

## Background
Tensor calculus often uses "abstract index notation" (Penrose notation), which is visually intuitive but syntactically complex to parse deterministically across different programming languages.

## Methodology
Evaluated multiple parsing strategies (Regex, LALR, PEG) for the following tensor-specific micro-syntax:
1. **Variance Markers**: `^a` (contravariant) vs `_a` (covariant).
2. **Derivative Operators**: `;c` (covariant derivative) vs `,c` (partial derivative).
3. **Indices on Tensors**: `R{^a _b _c _d}` (Abstract index block).
4. **Exterior Calculus**: `A ^ B` (Wedge product) vs `d(A)` (Exterior derivative).

## Findings

### 1. Parsing Challenges
- **Whitespace Significance**: In many tensor syntaxes, whitespace between indices is critical to avoid ambiguity (e.g., `T{^a_b}` vs `T{^a _b}`).
- **Left-to-Right Derivative Precedence**: Sequential derivatives like `T{;a ;b}` must be correctly interpreted as $\nabla_b (\nabla_a T)$.
- **Operator Overloading**: The use of `^` as both a variance marker (`^a`) and a wedge product (`A ^ B`) requires contextual disambiguation.

### 2. Strategy: Why PEG?
Parsing Expression Grammars (PEG) were chosen over LALR/CFG for the following reasons:
- **Deterministic**: PEGs eliminate ambiguity by using ordered choice.
- **Scannerless**: PEGs don't require a separate lexing phase, which is ideal for the compact micro-syntax of tensor expressions.
- **Language-Agnostic**: Modern PEG generators (e.g., `Arpeggio` in Python, `PEG.jl` in Julia) make it easy to share a single formal grammar across multiple language implementations.

## Conclusion
The **Chacana PEG Grammar (v0.2.4)** provides a robust, deterministic foundation for transforming tensor strings into a canonical JSON AST. This AST acts as the **ValidationToken** required by the Eleguá orchestrator.

## Next Steps
- Finalize the formal PEG specification in `openspec/specs/peg-grammar/`.
- Prototype the Python-based PEG parser using `Arpeggio`.
