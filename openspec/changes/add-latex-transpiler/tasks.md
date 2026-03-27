# Tasks: Add LaTeX Transpiler and Playground Integration

## 1. Specification & Design
- [ ] 1.1 Create `openspec/changes/add-latex-transpiler/proposal.md`
- [ ] 1.2 Create `openspec/changes/add-latex-transpiler/specs/latex-transpiler/spec.md`

## 2. Core Implementation
- [ ] 2.1 Implement `toLatex` logic in `vscode-chacana/src/server/latex.ts`
- [ ] 2.2 Implement basic `fromLatex` logic in `vscode-chacana/src/server/latex.ts`
- [ ] 2.3 Add unit tests for `toLatex` and `fromLatex` in `vscode-chacana/test/unit/latex.test.ts`
- [ ] 2.4 Verify all tests pass: `npm run test` in `vscode-chacana`

## 3. Playground Integration
- [ ] 3.1 Export `toLatex` and `fromLatex` from `vscode-chacana/src/browser/index.ts`
- [ ] 3.2 Build the browser bundle: `npm run build` in `vscode-chacana`
- [ ] 3.3 Add KaTeX CDN links to `docs/playground.md`
- [ ] 3.4 Add LaTeX Preview panel and Import from LaTeX UI to `docs/playground.md`
- [ ] 3.5 Update `docs/playground.md` JS to handle LaTeX rendering and importing

## 4. Verification
- [ ] 4.1 Validate the change proposal: `openspec validate add-latex-transpiler --strict`
- [ ] 4.2 Manually verify the playground functionality in a browser
- [ ] 4.3 Create a follow-up issue for the Python `to_latex` implementation
