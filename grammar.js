/**
 * @file Parser for the Nyx programming language
 * @author Luca Mezzavilla <lucamezza4@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "nyx",

  externals: $ => [$.newline, $.indent, $.dedent],

  extras: $ => [/\s/, $.comment],

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => choice(
      $.function_definition,
      $.let_statement,
      $.type_statement,
      $.comment
    ),

    comment: $ => token(seq("//", /.*/)),

    function_definition: $ => seq(
      "fn",
      $.identifier,
      "(",
      optional($.parameters),
      ")",
      optional(seq("->", $.type_annotation)),
      ":",
      $.newline,
      $.indent,
      repeat($._statement),
      $.dedent
    ),

    let_statement: $ => seq(
      "let",
      $.identifier,
      optional(seq(":", $.type_annotation)),
      "=",
      $.expression,
      $.newline
    ),

    type_statement: $ => seq(
      "type",
      $.identifier,
      "=",
      $.type_annotation,
      $.newline
    ),

    parameters: $ => sep1($.parameter, ","),

    parameter: $ => seq($.identifier, ":", $.type_annotation),

    type_annotation: $ => choice(
      $.type_u8,
      $.type_u16,
      $.type_u32,
      $.type_u64,
      $.type_i8,
      $.type_i16,
      $.type_i32,
      $.type_i64,
      $.type_f32,
      $.type_f64,
      $.type_bool,
      $.identifier
    ),

    type_u8: $ => token("u8"),
    type_u16: $ => token("u16"),
    type_u32: $ => token("u32"),
    type_u64: $ => token("u64"),
    type_i8: $ => token("i8"),
    type_i16: $ => token("i16"),
    type_i32: $ => token("i32"),
    type_i64: $ => token("i64"),
    type_f32: $ => token("f32"),
    type_f64: $ => token("f64"),
    type_bool: $ => token("bool"),

    expression: $ => choice(
      $.number,
      $.string,
      $.identifier,
      $.call_expression
    ),

    call_expression: $ => seq(
      $.identifier,
      "(",
      optional($.arguments),
      ")"
    ),

    arguments: $ => sep1($.expression, ","),

    number: $ => /\d+(\.\d+)?/,

    string: $ => seq('"', repeat(choice(/[^"]/, '""')), '"'),

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
  }
});

// helper function for comma-separated lists
function sep1(rule, sep) {
  return seq(rule, repeat(seq(sep, rule)));
}
