## 1. Specification Updates
- [ ] 1.1 Finalize `peg-grammar` delta with recursive expression indexing
- [ ] 1.2 Finalize `dsl-specification` delta with new operator typing rules
- [ ] 1.3 Create `differential-geometry` spec for exterior calculus and Lie derivatives
- [ ] 1.4 Update `treesitter-grammar` spec (to be done separately or included)

## 2. Grammar Implementation (Python/Arpeggio)
- [ ] 2.1 Update Arpeggio parser to handle recursive expression indexing
- [ ] 2.2 Add support for functional operators (`d`, `L`, `Tr`, etc.)
- [ ] 2.3 Implement symmetrization/anti-symmetrization tokens in index lists
- [ ] 2.4 Update JSON AST generator to handle new node types

## 3. Static Type System (Python)
- [ ] 3.1 Implement typing rules for exterior derivative (`d`)
- [ ] 3.2 Implement typing rules for Hodge star (`*`)
- [ ] 3.3 Implement typing rules for Lie derivatives (`L`)
- [ ] 3.4 Implement validation for symmetrized index structures

## 4. Verification
- [ ] 4.1 Create test cases for `(A + B){;a}`
- [ ] 4.2 Create test cases for `d(A ^ B)`
- [ ] 4.3 Create test cases for `L(X, R{^a _b _c _d})`
- [ ] 4.4 Verify across Eleguá orchestrator (if possible)
