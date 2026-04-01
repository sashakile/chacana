# Change: Add rank polymorphism for implicit contractions

## Why
The Gauss-Bonnet integrand `R * R - 4 * R{_a _b} * R{^a ^b} + R{_a _b _c _d} * R{^a ^b ^c ^d}` requires the Riemann tensor (rank 4) to appear at ranks 0, 2, and 4. Currently Rule 4 rejects any usage where the index count differs from the declared rank, making this expression impossible to write.

## What Changes
- **MODIFIED** Rule 4 to allow fewer indices than declared rank when `active_metric` is set, provided the difference is even (each missing pair represents an implicit trace/contraction)
- Rank count check remains strict when no `active_metric` is present
- Rank count check remains strict when the difference is odd (not a valid trace)

## Impact
- Affected specs: `dsl-specification` (Rule 4)
- Affected code: `src/chacana/checker.py` (`_check_rank`), `vscode-chacana/src/server/checker.ts` (`checkRank`), `docs/assets/js/chacana-checker.js` (rebuild)
