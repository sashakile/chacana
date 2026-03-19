/**
 * External scanner for Chacana Tree-sitter grammar.
 *
 * Handles the optional closing variance marker in symmetrization and
 * anti-symmetrization blocks.  The marker (^ or _) is only matched when
 * the very next non-whitespace character is the closing delimiter () or ]).
 * This avoids ambiguity with the start of a new index element.
 */

#include "tree_sitter/parser.h"

enum TokenType {
  CLOSING_VARIANCE,
};

void *tree_sitter_chacana_external_scanner_create(void) {
  return NULL;
}

void tree_sitter_chacana_external_scanner_destroy(void *payload) {
  (void)payload;
}

unsigned tree_sitter_chacana_external_scanner_serialize(
    void *payload, char *buffer) {
  (void)payload;
  (void)buffer;
  return 0;
}

void tree_sitter_chacana_external_scanner_deserialize(
    void *payload, const char *buffer, unsigned length) {
  (void)payload;
  (void)buffer;
  (void)length;
}

bool tree_sitter_chacana_external_scanner_scan(
    void *payload, TSLexer *lexer, const bool *valid_symbols) {
  (void)payload;

  if (!valid_symbols[CLOSING_VARIANCE]) {
    return false;
  }

  /* Bail out at end of input. */
  if (lexer->eof(lexer)) {
    return false;
  }

  /* Skip leading whitespace. */
  while (lexer->lookahead == ' '  || lexer->lookahead == '\t' ||
         lexer->lookahead == '\n' || lexer->lookahead == '\r') {
    lexer->advance(lexer, true);
    if (lexer->eof(lexer)) {
      return false;
    }
  }

  /* Must see ^ or _ to start a closing variance marker. */
  if (lexer->lookahead != '^' && lexer->lookahead != '_') {
    return false;
  }

  /* Consume the variance character and mark the token end. */
  lexer->advance(lexer, false);
  lexer->mark_end(lexer);

  /* Skip whitespace after the variance marker. */
  while (!lexer->eof(lexer) &&
         (lexer->lookahead == ' '  || lexer->lookahead == '\t' ||
          lexer->lookahead == '\n' || lexer->lookahead == '\r')) {
    lexer->advance(lexer, true);
  }

  /* Only match if the next real character is a closing delimiter. */
  if (!lexer->eof(lexer) &&
      (lexer->lookahead == ')' || lexer->lookahead == ']')) {
    lexer->result_symbol = CLOSING_VARIANCE;
    return true;
  }

  return false;
}
