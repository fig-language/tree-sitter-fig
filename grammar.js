/**
 * @file Parser for the Nyx programming language
 * @author Luca Mezzavilla <lucamezza4@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "nyx",

  word: $ => $.identifier,

  externals: $ => [$.newline, $.indent, $.dedent, $.whitespace],

  extras: $ => [/[ \t]/, $.comment],

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => choice(
      $.pass_statement,
      $.function_definition,
      $.let_statement,
      $.mut_statement,
      $.const_statement,
      $.type_statement,
      $.enum_definition,
      $.union_definition,
      $.struct_definition,
      $.interface_definition,
      $.namespace_definition,
      $.expression_statement,
      $.comment,
    ),

    comment: $ => token(seq("//", /.*/)),

    pass_statement: $ => seq("pass", $.newline),

    expression_statement: $ => seq($.expression, $.newline),

    namespace_definition: $ => seq(
      "namespace",
      $.identifier_path,
      $.newline,
      $.indent,
      optional($.whitespace),
      $._statement,
      repeat(seq(
        $.whitespace,
        $._statement
      )),
      $.dedent
    ),

    function_definition: $ => seq(
      $.function_signature,
      $.newline,
      $.indent,
      optional($.where_clause),
      optional($.whitespace),
      $._statement,
      repeat(seq(
        $.whitespace,
        $._statement
      )),
      $.dedent
    ),

    function_declaration: $ => seq(
      $.function_signature,
      $.newline
    ),

    function_signature: $ => seq(
      "fn",
      optional("!"),
      $.identifier_path,
      optional($.generic_parameters),
      "(",
      optional($.parameters),
      ")",
      optional(seq("->", $.type_annotation))
    ),

    type_identifier_path: $ => $.identifier_path,
    identifier_path: $ => seq(
      repeat(seq($.path_segment, "::")),
      choice(
        seq($.path_segment, ".", field("name", $.identifier)), // function
        field("name", $.identifier)                              // namespace
      )
    ),

    path_segment: $ => choice($.builtin_namespace, $.identifier),
    builtin_namespace: $ => choice("std", "core", "alloc"),

    let_statement: $ => seq(
      "let",
      $.identifier,
      optional(seq(":", $.type_annotation)),
      "=",
      $.expression,
      $.newline
    ),

    mut_statement: $ => seq(
      "mut",
      $.identifier,
      optional(seq(":", $.type_annotation)),
      "=",
      $.expression,
      $.newline
    ),

    const_statement: $ => seq(
      "const",
      $.identifier,
      optional(seq(":", $.type_annotation)),
      "=",
      $.expression,
      $.newline
    ),

    type_statement: $ => seq(
      "type",
      $.type_identifier_path,
      optional($.generic_parameters),
      "=",
      $.type_annotation,
      $.newline
    ),

    enum_definition: $ => seq(
      "enum",
      optional(seq("[", $.type_annotation, "]")),
      $.type_identifier_path,
      $.newline,
      $.indent,
      optional($.requires_clause),
      optional($.whitespace),
      $.enum_variant,
      repeat(seq($.whitespace, $.enum_variant)),
      $.dedent
    ),

    enum_variant: $ => seq(
      $.identifier,
      optional(seq("=", $.expression)),
      $.newline
    ),

    union_definition: $ => seq(
      "union",
      $.type_identifier_path,
      optional($.generic_parameters),
      $.newline,
      $.indent,
      optional($.requires_clause),
      optional($.where_clause),
      optional($.whitespace),
      $.union_variant,
      repeat(seq($.whitespace, $.union_variant)),
      $.dedent
    ),

    union_variant: $ => seq(
      $.identifier,
      ":",
      $.type_annotation,
      $.newline
    ),

    struct_definition: $ => seq(
      optional("packed"),
      "struct",
      $.type_identifier_path,
      optional($.generic_parameters),
      $.newline,
      $.indent,
      optional($.requires_clause),
      optional($.where_clause),
      optional($.whitespace),
      $.struct_field,
      repeat(seq($.whitespace, $.struct_field)),
      $.dedent
    ),

    struct_field: $ => seq(
      $.identifier,
      ":",
      $.type_annotation,
      $.newline
    ),

    interface_definition: $ => seq(
      "interface",
      $.type_identifier_path,
      optional($.generic_parameters),
      $.newline,
      $.indent,
      optional($.extends_clause),
      optional($.where_clause),
      optional($.whitespace),
      $.function_declaration,
      repeat(seq($.whitespace, $.function_declaration)),
      $.dedent
    ),

    where_clause: $ => seq(
      "where",
      $.newline,
      $.indent,
      repeat1($.constraint),
      $.dedent
    ),
    constraint: $ => choice($.type_constraint),
    type_constraint: $ => seq(
      $.identifier,
      ":",
      $.bound,
      $.newline
    ),
    bound: $ => sep1($.named, "+"),

    requires_clause: $ => seq(
      "requires",
      $.newline,
      $.indent,
      repeat1($.requirement),
      $.dedent
    ),
    requirement: $ => seq($.named, $.newline),

    extends_clause: $ => seq(
      "extends",
      $.newline,
      $.indent,
      repeat1($.extension),
      $.dedent
    ),
    extension: $ => seq($.named, $.newline),

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
      $.type_array,
      $.type_ref,
      $.type_const_ptr,
      $.type_ptr_raw,
      $.type_ptr,
      $.named_path,
    ),


    named_path: $ => seq(
      optional(seq(
        repeat1(seq($.named_scope, "::")),
      )),
      field("name", $.named)
    ),
    named_scope: $ => seq($.named),
    named: $ => seq($.identifier, optional($.generic_arguments)),

    generic_arguments: $ => seq('[', sep1($.type_annotation, ","), ']'),

    generic_parameters: $ => seq('[', sep1($.identifier, ","), ']'),

    namespace_path: $ => sep1($.identifier, "::"),
    type_path_segment: $ => choice($.type_annotation),

    type_array: $ => seq("[", optional($.expression), "]", $.type_annotation),
    type_ref: $ => seq("&", $.type_annotation),
    type_const_ptr: $ => seq("*", "const", $.type_annotation),
    type_ptr_raw: $ => seq("*", "raw"),
    type_ptr: $ => seq("*", $.type_annotation),

    type_u8: $ => "u8",
    type_u16: $ => "u16",
    type_u32: $ => "u32",
    type_u64: $ => "u64",
    type_i8: $ => "i8",
    type_i16: $ => "i16",
    type_i32: $ => "i32",
    type_i64: $ => "i64",
    type_f32: $ => "f32",
    type_f64: $ => "f64",
    type_bool: $ => "bool",

    expression: $ => choice(
      $.postfix_expression,
      $.unary_expression,
      $.binary_expression
    ),

    primary_expression: $ => choice(
      "self",
      $.identifier,
      $.number,
      $.boolean,
      $.string,
      $.interpolated_string,
      $.parenthesized_expression
    ),

    postfix_expression: $ => prec.left(12, seq(
      $.primary_expression,
      repeat(choice(
        seq(".", optional("!"), $.identifier, optional($.generic_arguments)),      // member access
        seq("::", $.identifier, optional($.generic_arguments)),     // namespace/type access
        seq(optional("!"), "(", optional($.arguments), ")"), // function call
        seq("[", $.expression, "]"), // array indexing
      ))
    )),

    call_expression: $ => seq(
      $.identifier,
      "(",
      optional($.arguments),
      ")"
    ),

    parenthesized_expression: $ => seq(
      "(",
      $.expression,
      ")"
    ),

    unary_expression: $ => prec(11, seq(
      choice("&", "*", "-", "+", "~", "!"),
      $.expression
    )),

    binary_expression: $ => choice(
      // Level 1: Multiplication, Division, Modulo
      prec.left(10, seq($.expression, choice("*", "/", "%"), $.expression)),

      // Level 2: Addition and Subtraction
      prec.left(9, seq($.expression, choice("+", "-"), $.expression)),

      // Level 3: Bit shifts
      prec.left(8, seq($.expression, choice("<<", ">>"), $.expression)),

      // Level 4: Comparison operators
      prec.left(7, seq($.expression, choice("<", ">", "<=", ">="), $.expression)),

      // Level 5: Equality operators
      prec.left(6, seq($.expression, choice("==", "!="), $.expression)),

      // Level 6: Bitwise AND
      prec.left(5, seq($.expression, "&", $.expression)),

      // Level 7: Bitwise XOR
      prec.left(4, seq($.expression, "^", $.expression)),

      // Level 8: Bitwise OR
      prec.left(3, seq($.expression, "|", $.expression)),

      // Level 9: Logical AND
      prec.left(2, seq($.expression, "&&", $.expression)),

      // Level 10: Logical OR (lowest precedence)
      prec.left(1, seq($.expression, "||", $.expression))
    ),

    arguments: $ => sep1($.expression, ","),

    number: $ => /\d+(\.\d+)?/,

    string: $ => seq('"', repeat(choice(/[^"]/, '""')), '"'),
    interpolated_string: $ => seq(
      field("start", "$\""),
      repeat(choice(
        field("text", $.string_text),
        $.interpolation)),
      field("end", "\"")
    ),
    string_text: $ => /[^"{]+/,
    interpolation: $ => seq("{", $.expression, "}"),

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,

    boolean: $ => choice("true", "false"),
  }
});

// helper function for comma-separated lists
function sep1(rule, sep) {
  return seq(rule, repeat(seq(sep, rule)));
}
