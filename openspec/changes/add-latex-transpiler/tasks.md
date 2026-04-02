# Tasks: Add LaTeX Transpiler and Playground Integration

## 1. Specification
- [x] 1.1 Create `openspec/changes/add-latex-transpiler/specs/latex-transpiler/spec.md`

## 2. Core Implementation — `toLatex`
- [x] 2.1 Write failing tests for `toLatex` in `vscode-chacana/test/unit/latex.test.ts`
- [x] 2.2 Implement `toLatex` in `vscode-chacana/src/server/latex.ts` to pass tests
- [x] 2.3 Verify: `npm run test` in `vscode-chacana`

## 3. Core Implementation — `fromLatex`
- [x] 3.1 Write failing tests for `fromLatex` in `vscode-chacana/test/unit/latex.test.ts`
- [x] 3.2 Implement `fromLatex` in `vscode-chacana/src/server/latex.ts` to pass tests
- [x] 3.3 Verify: `npm run test` in `vscode-chacana`

## 4. Playground Integration
- [x] 4.1 Export `toLatex` and `fromLatex` from `vscode-chacana/src/browser/index.ts`
- [x] 4.2 Build the browser bundle: `npm run build` in `vscode-chacana`
- [x] 4.3 Add KaTeX CDN links to `docs/playground.md`
- [x] 4.4 Add LaTeX Preview panel and Import from LaTeX UI to `docs/playground.md`
- [x] 4.5 Update `docs/playground.md` JS to handle LaTeX rendering and importing

## 5. Documentation
- [ ] 5.1 Document `toLatex` / `fromLatex` API usage in `docs/`

## 6. Verification
- [ ] 6.1 Validate the change proposal: `openspec validate add-latex-transpiler --strict`
- [ ] 6.2 Manually verify the playground functionality in a browser
- [ ] 6.3 Create a follow-up issue for the Python `to_latex` implementation
