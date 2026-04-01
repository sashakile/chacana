## 1. Implementation
- [x] 1.1 Add failing tests for rank polymorphism (R at ranks 0, 2, 4 with active_metric)
- [x] 1.2 Add failing test for odd-rank difference rejection (rank 4 used with 3 indices)
- [x] 1.3 Add failing test confirming strict rank check without active_metric
- [x] 1.4 Update `_check_rank` in `src/chacana/checker.py` to allow even-difference rank usage with active_metric
- [x] 1.5 Update `checkRank` in `vscode-chacana/src/server/checker.ts` with same logic
- [x] 1.6 Rebuild `docs/assets/js/chacana-checker.js`
- [x] 1.7 Run full test suite to confirm no regressions
