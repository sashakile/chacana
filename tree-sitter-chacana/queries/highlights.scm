; Chacana syntax highlighting queries
; ────────────────────────────────────

; Tensor and operator names
(tensor_expr
  name: (identifier) @type)

(functional_op
  name: (operator_keyword) @function.builtin)

; Index names
(index
  name: (identifier) @variable)

(derivative
  name: (identifier) @variable)

; Variance markers
(variance_marker) @operator

; Binary operators
(sum_expression
  operator: _ @operator)

(product_expression
  operator: _ @operator)

(wedge_expression
  operator: _ @operator)

; Derivative type markers (; and ,)
(derivative
  type: _ @operator)

; Numeric literals
(float) @number.float
(integer) @number

; Perturbation
(perturbation
  "@" @operator)

(perturbation
  order: (integer) @number)

; Brackets and delimiters
"{" @punctuation.bracket
"}" @punctuation.bracket
"(" @punctuation.bracket
")" @punctuation.bracket
"[" @punctuation.bracket
"]" @punctuation.bracket
"," @punctuation.delimiter
