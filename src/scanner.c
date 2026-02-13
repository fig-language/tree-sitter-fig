#include "tree_sitter/parser.h"
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>
#include <wctype.h>
#include <string.h>

enum TokenType {
  NEWLINE,
  INDENT,
  DEDENT,
};

typedef struct {
  uint16_t *indents;
  uint16_t size;
  uint16_t capacity;
} IndentStack;

typedef struct {
  IndentStack indents;
} Scanner;

// ----------------- helpers -----------------
static inline void push_indent(IndentStack *stack, uint16_t value) {
  if (stack->size >= stack->capacity) {
    stack->capacity = stack->capacity ? stack->capacity * 2 : 8;
    stack->indents = realloc(stack->indents, sizeof(uint16_t) * stack->capacity);
  }
  stack->indents[stack->size++] = value;
}

static inline uint16_t top_indent(IndentStack *stack) {
  return stack->size ? stack->indents[stack->size - 1] : 0;
}

static inline void pop_indent(IndentStack *stack) {
  if (stack->size > 0) stack->size--;
}

static inline void skip(TSLexer *lexer) { lexer->advance(lexer, true); }
static inline void advance(TSLexer *lexer) { lexer->advance(lexer, false); }

// ----------------- scanner -----------------
bool tree_sitter_nyx_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
  Scanner *scanner = (Scanner *)payload;

  lexer->mark_end(lexer);

  bool found_end_of_line = false;
  uint32_t indent_length = 0;
  for (;;) {
    if (lexer->lookahead == '\n') {
      found_end_of_line = true;
      indent_length = 0;
      skip(lexer);
    } else if (lexer->lookahead == ' ') {
      indent_length++;
      skip(lexer);
    } else if (lexer->lookahead == '\r' || lexer->lookahead == '\f') {
      indent_length = 0;
      skip(lexer);
    } else if (lexer->lookahead == '\t') {
      indent_length += 8;
      skip(lexer);
    } else if (lexer->eof(lexer)) {
      indent_length = 0;
      found_end_of_line = true;
      break;
    } else {
      break;
    }
  }

  if (found_end_of_line) {
    if (scanner->indents.size > 0) {
      uint16_t current_indent_length = top_indent(&scanner->indents);

      if (valid_symbols[INDENT] && indent_length > current_indent_length) {
        push_indent(&scanner->indents, indent_length);
        lexer->result_symbol = INDENT;
        return true;
      }

      if (valid_symbols[DEDENT] && indent_length < current_indent_length) {
        pop_indent(&scanner->indents);
        lexer->result_symbol = DEDENT;
        return true;
      }
    }

    if (valid_symbols[NEWLINE]) {
      lexer->result_symbol = NEWLINE;
      return true;
    }
  }

  return false;
}

// ----------------- serialization -----------------
unsigned tree_sitter_nyx_external_scanner_serialize(void *payload, char *buffer) {
  Scanner *scanner = (Scanner *)payload;
  if (scanner->indents.size > 255) return 0;
  buffer[0] = (char)scanner->indents.size;
  // Use memcpy to avoid copying the initial 0 indent
  size_t size = scanner->indents.size > 1 ? scanner->indents.size -1 : 0;
  memcpy(&buffer[1], &scanner->indents.indents[1], size);
  return 1 + size;
}

void tree_sitter_nyx_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  Scanner *scanner = (Scanner *)payload;
  scanner->indents.size = 0;
  push_indent(&scanner->indents, 0); // Always start with 0 indent
  if (length > 1) {
    uint8_t count = buffer[0];
    for (uint8_t i = 0; i < count - 1 && 1 + i < length; i++) {
        push_indent(&scanner->indents, (uint8_t)buffer[1+i]);
    }
  }
}

static void handle_file_end(void *payload, TSLexer *lexer) {
    Scanner *scanner = (Scanner *)payload;
    if (top_indent(&scanner->indents) > 0) {
        pop_indent(&scanner->indents);
        lexer->result_symbol = DEDENT;
    }
}

// ----------------- lifecycle -----------------
void *tree_sitter_nyx_external_scanner_create() {
  Scanner *scanner = calloc(1, sizeof(Scanner));
  push_indent(&scanner->indents, 0); // initial indent level
  return scanner;
}

void tree_sitter_nyx_external_scanner_destroy(void *payload) {
  Scanner *scanner = (Scanner *)payload;
  free(scanner->indents.indents);
  free(scanner);
}
