/**
 * @file Tree-sitter grammar for Chacana tensor calculus micro-syntax
 * @license MIT
 * @see {@link https://github.com/sk/chacana}
 *
 * Mirrors the PEG grammar from openspec/specs/peg-grammar/spec.md.
 * Numeric precedence levels used in prec() calls (low → high):
 *   1  sum  (+, -)
 *   2  product  (*)
 *   3  wedge  (^)
 *   4  functional operators  (d, L, Tr, …)
 * Index attachment and atomic rules derive precedence from nesting structure.
 */

/// <reference types="tree-sitter-cli/dsl" />

module.exports = grammar({
  name: 'chacana',

  extras: $ => [/\s/],

  externals: $ => [
    $._closing_variance,
  ],

  rules: {
    // ── Entry point ────────────────────────────────────────────────
    source_file: $ => $._expression,

    _expression: $ => choice(
      $.sum_expression,
      $.product_expression,
      $.wedge_expression,
      $._primary,
    ),

    // ── Binary operators (left-associative) ────────────────────────
    sum_expression: $ => prec.left(1, seq(
      field('left', $._expression),
      field('operator', choice('+', '-')),
      field('right', $._expression),
    )),

    product_expression: $ => prec.left(2, seq(
      field('left', $._expression),
      field('operator', '*'),
      field('right', $._expression),
    )),

    wedge_expression: $ => prec.left(3, seq(
      field('left', $._expression),
      field('operator', '^'),
      field('right', $._expression),
    )),

    // ── Primary expressions ────────────────────────────────────────
    _primary: $ => choice(
      $.functional_op,
      $.tensor_expr,
      $.scalar,
      $.perturbation,
      $.commutator,
      $.paren_expression,
    ),

    // Known operator keywords for functional operators.
    operator_keyword: $ => choice('d', 'L', 'Tr', 'det', 'inv', 'star', 'hodge', 'i'),

    // Functional operator: d(ω), L(X, T{^a _b}), Tr(T), etc.
    // Only known operator keywords are accepted; unknown identifiers
    // followed by '(' fall through to tensor_expr + paren_expression.
    functional_op: $ => prec(4, seq(
      field('name', $.operator_keyword),
      '(',
      optional(field('arguments', $.argument_list)),
      ')',
      optional(field('indices', $.index_block)),
    )),

    argument_list: $ => seq(
      $._expression,
      repeat(seq(',', $._expression)),
    ),

    // Tensor with optional index block: R{^a _b _c _d}
    tensor_expr: $ => seq(
      field('name', $.identifier),
      optional(field('indices', $.index_block)),
    ),

    // ── Scalar literals ────────────────────────────────────────────
    scalar: $ => choice($.float, $.integer),

    float: $ => /[0-9]+\.[0-9]+/,

    integer: $ => /[0-9]+/,

    // ── Index system ───────────────────────────────────────────────
    index_block: $ => seq('{', $.index_list, '}'),

    index_list: $ => repeat1($._index_element),

    _index_element: $ => choice(
      $.symmetrization,
      $.anti_symmetrization,
      $.index,
    ),

    // Explicit symmetrization: _( a b _)
    // Uses sym_index_list (indices only, no nesting) to structurally
    // reject nested symmetrization like _( _( a b _) _).
    symmetrization: $ => seq(
      field('opening_variance', $.variance_marker),
      '(',
      $.sym_index_list,
      optional(field('closing_variance',
        alias($._closing_variance, $.variance_marker))),
      ')',
    ),

    // Explicit anti-symmetrization: _[ a b _]
    anti_symmetrization: $ => seq(
      field('opening_variance', $.variance_marker),
      '[',
      $.sym_index_list,
      optional(field('closing_variance',
        alias($._closing_variance, $.variance_marker))),
      ']',
    ),

    // Index list inside symmetrization — only plain indices, no nesting
    sym_index_list: $ => repeat1($.index),

    // Single index with optional variance marker
    index: $ => seq(
      optional(field('variance', $.variance_marker)),
      field('name', choice($.derivative, $.identifier)),
    ),

    // Covariant (;) or comma (,) derivative
    derivative: $ => seq(
      field('type', choice(';', ',')),
      field('name', $.identifier),
    ),

    // Variance: ^ (contravariant) or _ (covariant)
    variance_marker: $ => choice('^', '_'),

    // ── Special forms ──────────────────────────────────────────────

    // Perturbation: @n(expr)
    perturbation: $ => seq(
      '@',
      field('order', $.integer),
      '(',
      field('body', $._expression),
      ')',
    ),

    // Commutator: [A, B]
    commutator: $ => seq(
      '[',
      field('left', $._expression),
      ',',
      field('right', $._expression),
      ']',
    ),

    // Parenthesized sub-expression
    paren_expression: $ => seq('(', $._expression, ')'),

    // ── Terminals ──────────────────────────────────────────────────

    // Latin letters (a-z, A-Z) and Greek (Α-Ρ, Σ-Ω, α-ω)
    identifier: $ => /[a-zA-Z\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9][a-zA-Z0-9\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9]*/,
  },
});
