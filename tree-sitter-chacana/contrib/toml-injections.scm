; Chacana TOML injection queries (for tree-sitter-toml)
; ─────────────────────────────────────────────────────
; These queries run against tree-sitter-toml, NOT tree-sitter-chacana.
; They inject Chacana micro-syntax highlighting into string values
; within Chacana-flavored TOML context files.
;
; Installation:
;   Copy this file into your tree-sitter-toml queries directory, or
;   configure your editor to load it as an additional injection source
;   for .toml files in Chacana projects.
;
; Neovim example (~/.config/nvim/after/queries/toml/injections.scm):
;   ; extends
;   <paste contents below>

; ── Yachay identity/invariant expressions ──────────────────────────
; Chacana expressions embedded in Yachay TOML schemas:
;   [[identity]]
;   statement = "R{^a _b _c _d} + R{^a _c _d _b} + R{^a _d _b _c}"
;
;   [[rule]]
;   expression = "R{^a _b _c _d}"
(pair
  (bare_key) @_key
  (string) @injection.content
  (#match? @_key "^(statement|expression|lhs|rhs)$")
  (#set! injection.language "chacana"))

; ── Metric declarations ────────────────────────────────────────────
; sxAct-style metric string values that contain tensor notation:
;   metric = "g[-a,-b]"
(pair
  (bare_key) @_key
  (string) @injection.content
  (#match? @_key "^(metric|covd|tensor)$")
  (#set! injection.language "chacana"))
