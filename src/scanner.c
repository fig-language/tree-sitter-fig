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
  WHITESPACE,
};

typedef struct {
  uint16_t *indents;
  uint16_t size;
  uint16_t capacity;
} IndentStack;

typedef struct {
  IndentStack indents;
  uint16_t queued_dedent_count;
  uint16_t queued_indent_count;
  uint16_t base_indent_size;
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

  // Handle queued indents
  if (scanner->queued_indent_count > 0) {
    if (valid_symbols[INDENT]) {
      scanner->queued_indent_count--;
      uint16_t current = top_indent(&scanner->indents);
      push_indent(&scanner->indents, current + scanner->base_indent_size);
      lexer->result_symbol = INDENT;
      lexer->mark_end(lexer);
      return true;
    }
    scanner->queued_indent_count = 0;
  }

  // Handle queued dedents
  if (scanner->queued_dedent_count > 0) {
    if (valid_symbols[DEDENT]) {
      scanner->queued_dedent_count--;
      pop_indent(&scanner->indents);
      lexer->result_symbol = DEDENT;
      lexer->mark_end(lexer);
      return true;
    }
    scanner->queued_dedent_count = 0;
  }

  // Handle EOF: emit all remaining dedents
  if (lexer->eof(lexer) && valid_symbols[DEDENT] && scanner->indents.size > 0) {
    pop_indent(&scanner->indents);
    lexer->result_symbol = DEDENT;
    lexer->mark_end(lexer);
    return true;
  }

  // Handle NEWLINE
  if (valid_symbols[NEWLINE]) {
    if (lexer->lookahead == '\n') {
      skip(lexer);
      lexer->result_symbol = NEWLINE;
      lexer->mark_end(lexer);
      return true;
    }
    if (lexer->lookahead == '\r') {
      skip(lexer);
      if (lexer->lookahead == '\n') {
        skip(lexer);
      }
      lexer->result_symbol = NEWLINE;
      lexer->mark_end(lexer);
      return true;
    }
  }

  // Measure indentation
  uint32_t indent_length = 0;
  bool at_line_start = false;
  
  while (lexer->lookahead == ' ') {
    indent_length++;
    at_line_start = true;
    skip(lexer);
  }
  
  while (lexer->lookahead == '\t') {
    indent_length += 8;
    at_line_start = true;
    skip(lexer);
  }
  
  // If no whitespace consumed, check if we're at a non-whitespace character.
  // Use get_column() to get the actual column — this handles the case where a
  // previous DEDENT consumed the leading spaces (mark_end after spaces), so
  // we land directly at the content character but it may be at column > 0.
  if (!at_line_start && lexer->lookahead != '\n' && lexer->lookahead != '\r' && !lexer->eof(lexer)) {
    at_line_start = true;
    indent_length = lexer->get_column(lexer);
  }
  
  // Mark end after consuming whitespace so it's not consumed by extras on error
  if (at_line_start) {
    lexer->mark_end(lexer);
  }
  
  // Process indentation at line start
  if (at_line_start && lexer->lookahead != '\n' && lexer->lookahead != '\r' && !lexer->eof(lexer)) {
    uint16_t current_indent_length = top_indent(&scanner->indents);

    // INDENT: indentation increased
    if (valid_symbols[INDENT] && indent_length > current_indent_length) {
      // Set base indent on first indent
      if (scanner->base_indent_size == 0 && current_indent_length == 0) {
        scanner->base_indent_size = indent_length;
      }
      
      // Validate: must be multiple of base
      if (scanner->base_indent_size > 0) {
        if (indent_length % scanner->base_indent_size != 0) {
          return false;
        }
        
        uint16_t indent_diff = indent_length - current_indent_length;
        uint16_t indent_levels = indent_diff / scanner->base_indent_size;
        
        if (indent_levels == 0) {
          return false;
        }
        
        // Queue additional indents
        if (indent_levels > 1) {
          scanner->queued_indent_count = indent_levels - 1;
        }
      }
      
      push_indent(&scanner->indents, current_indent_length + scanner->base_indent_size);
      lexer->result_symbol = INDENT;
      lexer->mark_end(lexer);
      return true;
    }

    // DEDENT: indentation decreased
    if (valid_symbols[DEDENT] && indent_length < current_indent_length) {
      // Validate: must be multiple of base
      if (scanner->base_indent_size > 0 && indent_length % scanner->base_indent_size != 0) {
        return false;
      }
      
      // Find matching indent level
      int dedent_count = 0;
      bool found_match = false;
      
      for (int i = scanner->indents.size - 1; i >= 0; i--) {
        if (scanner->indents.indents[i] == indent_length) {
          found_match = true;
          break;
        }
        if (scanner->indents.indents[i] < indent_length) {
          return false;
        }
        dedent_count++;
      }
      
      if (!found_match || dedent_count == 0) {
        return false;
      }
      
      // Queue additional dedents
      scanner->queued_dedent_count = dedent_count - 1;
      pop_indent(&scanner->indents);
      lexer->result_symbol = DEDENT;
      lexer->mark_end(lexer);
      return true;
    }
    
    // Indentation must match current level
    if (indent_length == current_indent_length) {
      // Indentation matches - emit WHITESPACE if requested
      if (valid_symbols[WHITESPACE]) {
        lexer->result_symbol = WHITESPACE;
        lexer->mark_end(lexer);
        return true;
      }
      return false;
    }
    
    // Indentation doesn't match and we're not INDENT/DEDENT - error
    if (scanner->base_indent_size > 0 && indent_length % scanner->base_indent_size != 0) {
      return false;
    }
    return false;
  }
  
  // Look ahead through blank lines
  if (!at_line_start) {
    return false;
  }
  
  bool found_end_of_line = at_line_start && (lexer->lookahead == '\n' || lexer->lookahead == '\r');
  indent_length = 0;
  
  for (;;) {
    if (lexer->lookahead == '\n') {
      found_end_of_line = true;
      indent_length = 0;
      skip(lexer);
    } else if (lexer->lookahead == ' ') {
      indent_length++;
      skip(lexer);
    } else if (lexer->lookahead == '\r') {
      found_end_of_line = true;
      indent_length = 0;
      skip(lexer);
      if (lexer->lookahead == '\n') {
        skip(lexer);
      }
    } else if (lexer->lookahead == '\f') {
      indent_length = 0;
      skip(lexer);
    } else if (lexer->lookahead == '\t') {
      indent_length += 8;
      skip(lexer);
    } else if (lexer->eof(lexer)) {
      found_end_of_line = true;
      indent_length = 0;
      break;
    } else {
      break;
    }
  }

  if (!found_end_of_line) {
    return false;
  }

  // Skip blank lines
  if (lexer->lookahead == '\n' || lexer->lookahead == '\r') {
    return false;
  }

  uint16_t current_indent_length = top_indent(&scanner->indents);

  // INDENT
  if (valid_symbols[INDENT] && indent_length > current_indent_length) {
    if (scanner->base_indent_size == 0 && current_indent_length == 0) {
      scanner->base_indent_size = indent_length;
    }
    
    if (scanner->base_indent_size > 0) {
      if (indent_length % scanner->base_indent_size != 0) {
        return false;
      }
      
      uint16_t indent_diff = indent_length - current_indent_length;
      uint16_t indent_levels = indent_diff / scanner->base_indent_size;
      
      if (indent_levels == 0) {
        return false;
      }
      
      if (indent_levels > 1) {
        scanner->queued_indent_count = indent_levels - 1;
      }
    }
    
    push_indent(&scanner->indents, current_indent_length + scanner->base_indent_size);
    lexer->result_symbol = INDENT;
    lexer->mark_end(lexer);
    return true;
  }

  // DEDENT
  if (valid_symbols[DEDENT] && indent_length < current_indent_length) {
    if (scanner->base_indent_size > 0 && indent_length % scanner->base_indent_size != 0) {
      return false;
    }
    
    int dedent_count = 0;
    bool found_match = false;
    
    for (int i = scanner->indents.size - 1; i >= 0; i--) {
      if (scanner->indents.indents[i] == indent_length) {
        found_match = true;
        break;
      }
      if (scanner->indents.indents[i] < indent_length) {
        return false;
      }
      dedent_count++;
    }
    
    if (!found_match || dedent_count == 0) {
      return false;
    }
    
    scanner->queued_dedent_count = dedent_count - 1;
    pop_indent(&scanner->indents);
    lexer->result_symbol = DEDENT;
    lexer->mark_end(lexer);
    return true;
  }

  return false;
}

// ----------------- serialization -----------------
unsigned tree_sitter_nyx_external_scanner_serialize(void *payload, char *buffer) {
  Scanner *scanner = (Scanner *)payload;
  if (scanner->indents.size > 127) return 0;
  
  size_t i = 0;
  buffer[i++] = (char)scanner->indents.size;
  buffer[i++] = (char)(scanner->queued_dedent_count & 0xFF);
  buffer[i++] = (char)((scanner->queued_dedent_count >> 8) & 0xFF);
  buffer[i++] = (char)(scanner->queued_indent_count & 0xFF);
  buffer[i++] = (char)((scanner->queued_indent_count >> 8) & 0xFF);
  buffer[i++] = (char)(scanner->base_indent_size & 0xFF);
  buffer[i++] = (char)((scanner->base_indent_size >> 8) & 0xFF);
  
  for (size_t j = 0; j < scanner->indents.size && i < TREE_SITTER_SERIALIZATION_BUFFER_SIZE - 1; j++) {
    buffer[i++] = (char)(scanner->indents.indents[j] & 0xFF);
    buffer[i++] = (char)((scanner->indents.indents[j] >> 8) & 0xFF);
  }
  
  return i;
}

void tree_sitter_nyx_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
  Scanner *scanner = (Scanner *)payload;
  scanner->indents.size = 0;
  scanner->queued_dedent_count = 0;
  scanner->queued_indent_count = 0;
  scanner->base_indent_size = 0;
  
  if (length == 0) {
    push_indent(&scanner->indents, 0);
    return;
  }
  
  size_t i = 0;
  uint8_t count = (uint8_t)buffer[i++];
  
  if (i < length) scanner->queued_dedent_count = (uint8_t)buffer[i++];
  if (i < length) scanner->queued_dedent_count |= ((uint16_t)(uint8_t)buffer[i++]) << 8;
  if (i < length) scanner->queued_indent_count = (uint8_t)buffer[i++];
  if (i < length) scanner->queued_indent_count |= ((uint16_t)(uint8_t)buffer[i++]) << 8;
  if (i < length) scanner->base_indent_size = (uint8_t)buffer[i++];
  if (i < length) scanner->base_indent_size |= ((uint16_t)(uint8_t)buffer[i++]) << 8;
  
  for (uint8_t j = 0; j < count && i + 1 < length; j++) {
    uint16_t indent = (uint8_t)buffer[i++];
    indent |= ((uint16_t)(uint8_t)buffer[i++]) << 8;
    push_indent(&scanner->indents, indent);
  }
  
  if (scanner->indents.size == 0) {
    push_indent(&scanner->indents, 0);
  }
}

// ----------------- lifecycle -----------------
void *tree_sitter_nyx_external_scanner_create() {
  Scanner *scanner = calloc(1, sizeof(Scanner));
  push_indent(&scanner->indents, 0);
  scanner->queued_dedent_count = 0;
  scanner->queued_indent_count = 0;
  scanner->base_indent_size = 0;
  return scanner;
}

void tree_sitter_nyx_external_scanner_destroy(void *payload) {
  Scanner *scanner = (Scanner *)payload;
  free(scanner->indents.indents);
  free(scanner);
}
