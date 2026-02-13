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

    parameters: $ => sep1($.identifier, ","),

    type_annotation: $ => $.identifier,

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
