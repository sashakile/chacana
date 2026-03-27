# Change: Add LaTeX Transpiler and Playground Integration

## Why
Users need a way to visualize Chacana expressions in standard mathematical notation (LaTeX) and to import existing LaTeX tensor expressions into Chacana micro-syntax. This bridges the gap between publication-quality rendering and machine-parseable computation.

## What Changes
- **ADDED** `latex-transpiler` capability to the core specification.
- **Implemented** `toLatex` and `fromLatex` functions in the TypeScript/JavaScript engine.
- **Enhanced** the Web Playground with real-time KaTeX rendering and LaTeX import functionality.
- **Updated** the browser bundle to export LaTeX transformation utilities.

## Impact
- Affected specs: `latex-transpiler` (new).
- Affected code:
  - `vscode-chacana/src/server/latex.ts` (new)
  - `vscode-chacana/src/browser/index.ts` (modified)
  - `docs/playground.md` (modified)
  - `vscode-chacana/test/unit/latex.test.ts` (new)
