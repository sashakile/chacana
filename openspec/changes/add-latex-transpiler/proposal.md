# Change: Add LaTeX Transpiler and Playground Integration

## Why
Users currently cannot preview Chacana expressions in standard mathematical notation or import LaTeX expressions from papers. A bidirectional LaTeX transpiler closes this gap.

## What Changes
- **ADD** `latex-transpiler` capability to the core specification.
- **Implement** `toLatex` and `fromLatex` functions in the TypeScript engine (Phase 1; Python implementation is a follow-up).
- **Enhance** the Web Playground with real-time LaTeX rendering and LaTeX import functionality.
- **Update** the browser bundle to export LaTeX transformation utilities.

## Impact
- Affected specs: `latex-transpiler` (new).
- Affected code:
  - `vscode-chacana/src/server/latex.ts` (new)
  - `vscode-chacana/src/browser/index.ts` (modified)
  - `docs/playground.md` (modified)
  - `vscode-chacana/test/unit/latex.test.ts` (new)
