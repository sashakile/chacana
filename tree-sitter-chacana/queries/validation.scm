; Chacana static validation queries
; Used by IDE tooling for real-time index analysis.
; ─────────────────────────────────────────────────

; ── Index label extraction ──────────────────────────────────────────
; All indices with explicit variance
(index
  variance: (variance_marker) @index.variance
  name: (identifier) @index.label)

; Indices without explicit variance (inherit from enclosing context)
(index
  !variance
  name: (identifier) @index.label.inherited)

; ── Derivative identification ───────────────────────────────────────
; Covariant derivatives (semicolon)
(index
  name: (derivative
    type: ";" @derivative.covariant
    name: (identifier) @derivative.label))

; Comma derivatives
(index
  name: (derivative
    type: "," @derivative.comma
    name: (identifier) @derivative.label))

; ── Symmetrization variance consistency ─────────────────────────────
; Opening variance of symmetrization blocks — compare against child
; index variances to detect mismatches.
(symmetrization
  opening_variance: (variance_marker) @sym.opening_variance)

(symmetrization
  (index_list
    (index
      variance: (variance_marker) @sym.index_variance)))

(anti_symmetrization
  opening_variance: (variance_marker) @antisym.opening_variance)

(anti_symmetrization
  (index_list
    (index
      variance: (variance_marker) @antisym.index_variance)))

; ── Tensor declaration references ───────────────────────────────────
; All tensor names — cross-reference against GlobalContext Γ
(tensor_expr
  name: (identifier) @tensor.reference)

; Functional operator names — validate against known operators
(functional_op
  name: (identifier) @operator.reference)
