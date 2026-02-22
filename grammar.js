/**
 * @file Parser for the Fig programming language
 * @author Luca Mezzavilla <lucamezza4@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "fig",

  word: $ => $.identifier,

  externals: $ => [$.newline, $.indent, $.dedent, $.whitespace],

  extras: $ => [/[ \t]/, $.comment],

  conflicts: $ => [
    [$.path_segment, $.primary_expression],
    [$.type_name_path],
  ],

  rules: {
    source_file: $ => repeat($._statement),

    _statement: $ => choice(
      $.pass_statement,
      $.function_definition,
      $.function_declaration,
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
      $.block_statement,
      $.using_statement,
      $.if_statement,
      $.for_loop,
      $.while_loop,
      $.return_statement,
      $.comment,
    ),

    comment: $ => token(seq("//", /.*/)),

    annotation: $ => seq(
      "#",
      field("name", $.identifier),
      optional(seq("(", sep1($.expression, ","), ")"))
    ),
    annotations: $ => repeat1(seq($.annotation, $.newline)),


    pass_statement: $ => seq("pass", $.newline),

    expression_statement: $ => seq($.expression, $.newline),

    namespace_definition: $ => seq(
      optional($.visibility_modifier),
      optional($.annotations),
      "namespace",
      field("name", $.name_path),
      optional(seq(
        $.newline,
        $.indent,
        repeat1($._statement),
        $.dedent
      )),
    ),

    using_statement: $ => seq(
      optional($.visibility_modifier),
      optional($.annotations),
      "using",
      field("name", $.name_path),
    ),

    function_definition: $ => seq(
      $.function_signature,
      $.newline,
      $.indent,
      optional($.where_clause),
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
      optional($.annotations),
      optional($.visibility_modifier),
      optional("extern"),
      "func",
      optional("!"),
      optional($.generic_parameters),
      $.type_name_path,
      optional(seq("::", $.generic_parameters)),
      "(",
      optional($.parameters),
      ")",
      optional(seq("->", sep1($.type_annotation, ",")))
    ),

    // Path WITH generic arguments for types and expressions
    // - Simple: identifier
    // - Namespaced: std::identifier, core::io::print
    // - With generics: Vec[T], std::Vec[T] (generics at END of path)
    // - Type-prefixed: ::*T::method, ::Vec[T]::something
    path: $ => seq(
      choice(
        // Type-prefixed path (must start with ::)
        // Uses simple_type_annotation to avoid recursion
        seq("::", $.simple_type_annotation, repeat1(seq("::", $.path_segment))),
        // Namespaced path or simple identifier
        seq(
          repeat(seq($.path_segment, "::")),
          $.path_segment,
        )
      ),
      // Generic arguments only at the END of the complete path
      // This eliminates ambiguity with array types like Vec[20]
      optional($.generic_arguments)
    ),

    name_path: $ => choice(
      // Type-prefixed path (must start with ::)
      seq(
        "::",
        $.simple_type_annotation,
        repeat1(seq("::", $.path_segment))),
      // Namespaced path or simple identifier
      seq(
        repeat(seq($.path_segment, "::")),
        field("name", $.path_segment),
        optional($.generic_parameters)
      ),
    ),

    type_name_path: $ => choice(
      // Type-prefixed path (must start with ::)
      seq(
        "::",
        $.simple_type_annotation,
        repeat(seq("::", $.path_segment)),
        seq("::", field("name", $.path_segment)),
      ),
      // Namespaced path or simple identifier
      seq(
        repeat(seq($.segment_with_generics, "::")),
        field("name", $.segment_with_generics)
      ),
      seq(
        optional(sep1($.segment_with_generics, "::")),
        ".",
        field("name", $.path_segment)
      ),
    ),
    segment_with_generics: $ => seq($.path_segment, optional($.generic_arguments)),

    // Path segment WITHOUT generics (moved to path level)
    path_segment: $ => choice($.identifier, $.builtin_namespace),

    builtin_namespace: $ => choice("std", "core", "alloc"),

    return_statement: $ => seq(
      "return",
      $.expression,
    ),

    let_statement: $ => seq(
      optional($.annotations),
      "let",
      field("name", $.identifier),
      optional(seq(":", $.type_annotation)),
      "=",
      $.expression,
      $.newline
    ),

    mut_statement: $ => seq(
      optional($.annotations),
      "mut",
      field("name", $.identifier),
      optional(seq(":", $.type_annotation)),
      "=",
      $.expression,
      $.newline
    ),

    const_statement: $ => seq(
      optional($.visibility_modifier),
      optional($.annotations),
      "const",
      optional($.generic_parameters),
      field("name", $.type_name_path),
      optional(seq(":", $.type_annotation)),
      "=",
      $.expression,
      $.newline
    ),

    block_statement: $ => seq(
      "block",
      optional(field("name", $.identifier)),
      $.newline,
      $.indent,
      repeat1($._statement),
      $.dedent
    ),

    if_statement: $ => choice(
      seq(
        "if",
        field("condition", $.expression),
        $.if_body,
        repeat(seq(
          "elif",
          field("condition", $.expression),
          $.if_body
        )),
        optional(seq(
          "else",
          $.if_body
        ))
      ),
    ),
    if_body: $ => seq(
      $.newline,
      $.indent,
      repeat1($._statement),
      $.dedent
    ),

    for_loop: $ => seq(
      "for",
      field("pattern", $.identifier),  // TODO: pattern matching
      "in",
      field("iterable", $.expression),
      optional($.body)
    ),
    while_loop: $ => seq(
      "while",
      field("condition", $.expression),
    ),
    body: $ => seq(
      $.newline,
      $.indent,
      repeat1($._statement),
      $.dedent
    ),

    type_statement: $ => seq(
      optional($.visibility_modifier),
      optional($.annotations),
      "type",
      field("name", $.name_path),
      "=",
      $.type_annotation,
      $.newline
    ),

    enum_definition: $ => seq(
      optional($.visibility_modifier),
      optional($.annotations),
      "enum",
      optional(seq("[", $.type_annotation, "]")),
      field("name", $.name_path),
      $.newline,
      $.indent,
      optional($.requires_clause),
      $.enum_variant,
      repeat(seq($.whitespace, $.enum_variant)),
      $.dedent
    ),

    enum_variant: $ => seq(
      field("name", $.identifier),
      optional(seq("=", $.expression)),
      $.newline
    ),

    union_definition: $ => seq(
      optional($.visibility_modifier),
      optional($.annotations),
      "union",
      field("name", $.name_path),
      $.newline,
      $.indent,
      optional($.requires_clause),
      optional($.where_clause),
      $.union_variant,
      repeat(seq($.whitespace, $.union_variant)),
      $.dedent
    ),

    union_variant: $ => seq(
      field("name", $.identifier),
      ":",
      $.type_annotation,
      $.newline
    ),


    struct_definition: $ => seq(
      optional($.visibility_modifier),
      optional($.annotations),
      optional("packed"),
      "struct",
      field("name", $.name_path),
      optional($.struct_body)
    ),

    struct_body: $ => seq(
      $.newline,
      $.indent,
      choice(
        // One or more clauses (requires/where), optionally followed by fields
        seq(
          repeat1(choice($.requires_clause, $.where_clause)),
          optional(seq(
            $.struct_field,
            $.newline,
            repeat(seq($.whitespace, $.struct_field, $.newline))
          ))
        ),
        // Fields only (no clauses)
        seq(
          $.struct_field,
          $.newline,
          repeat(seq($.whitespace, $.struct_field, $.newline))
        )
      ),
      $.dedent
    ),

    struct_field: $ => seq(
      field("name", $.identifier),
      ":",
      $.type_annotation,
    ),

    interface_definition: $ => choice(
      // Empty interface - no body
      seq(
        optional($.visibility_modifier),
        optional($.annotations),
        "interface",
        field("name", $.name_path),
      ),
      // Interface with body
      seq(
        optional($.visibility_modifier),
        optional($.annotations),
        "interface",
        field("name", $.name_path),
        $.newline,
        $.indent,
        choice(
          // Clauses only (extends/where/requires, no functions)
          repeat1(choice($.extends_clause, $.where_clause, $.requires_clause)),
          // Functions only, or clauses followed by functions
          seq(
            repeat(choice($.extends_clause, $.where_clause, $.requires_clause)),
            $.function_declaration,
            repeat(seq($.whitespace, $.function_declaration))
          )
        ),
        $.dedent
      )
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
    bound: $ => sep1($.path, "+"),

    requires_clause: $ => seq(
      "requires",
      $.newline,
      $.indent,
      repeat1($.requirement),
      $.dedent
    ),
    requirement: $ => seq($.path, $.newline),

    extends_clause: $ => seq(
      "extends",
      $.newline,
      $.indent,
      repeat1($.extension),
      $.dedent
    ),
    extension: $ => seq($.path, $.newline),

    visibility_modifier: $ => choice("public", "export", "private"),

    parameters: $ => seq(
      optional($.self_parameter),
      sep1($.parameter, ","),
    ),

    self_parameter: $ => seq(
      optional("*"),
      optional("mut"),
      "self",
    ),
    parameter: $ => seq(field("name", $.identifier), ":", $.type_annotation),

    type_annotation: $ => choice(
      $.type_ptr,
      $.type_array_or_slice,
      $.type_ok_error,
      $.base_type,
    ),

    // Simple type annotation for use in type-prefixed paths
    // This version doesn't allow multi-segment paths (no ::)
    // Breaking the recursion: path → simple_type → path_segment (not path)
    simple_type_annotation: $ => choice(
      $.simple_type_ptr,
      $.simple_base_type,
    ),

    type_array_or_slice: $ => choice(
      // Slice: [Type]
      seq("[", $.type_annotation, "]"),
      // Fixed-size array: [Type; expr]
      seq("[", $.type_annotation, ";", $.expression, "]")
    ),

    type_ok_error: $ => seq(
      $.type_annotation,
      "!",
      $.path
    ),

    simple_base_type: $ => prec(1, seq(
      // Prefix array/slice operators (consistent with base_type)
      repeat(
        "?"
      ),
      choice(
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
        $.type_ok,
        $.type_null,
        $.simple_path,  // Single segment with optional generics
      ),
    )),

    simple_type_ptr: $ => seq(
      "*",
      optional("mut"),
      $.simple_type_annotation
    ),

    // Simple path: single segment with optional generics (for ::Vec[T]::method)
    simple_path: $ => seq(
      $.path_segment,
      optional($.generic_arguments)
    ),

    base_type: $ => prec(1, seq(
      repeat("?"),
      choice(
        $.type_u8,
        $.type_u16,
        $.type_u32,
        $.type_u64,
        $.type_usize,
        $.type_i8,
        $.type_i16,
        $.type_i32,
        $.type_i64,
        $.type_isize,
        $.type_f32,
        $.type_f64,
        $.type_bool,
        $.type_ok,
        $.type_null,
        $.path,
      ),
    )),

    type_ptr: $ => prec(1, seq(
      optional("?"),
      "*",
      optional("mut"),
      $.type_annotation
    )),

    generic_arguments: $ => seq('[', sep1($.type_annotation, ","), ']'),

    generic_parameters: $ => seq('[', sep1($.generic_parameter, ","), ']'),
    generic_parameter: $ => seq(
      $.identifier,
      optional(seq("=", $.type_annotation))
    ),

    type_u8: $ => "u8",
    type_u16: $ => "u16",
    type_u32: $ => "u32",
    type_u64: $ => "u64",
    type_usize: $ => "usize",
    type_i8: $ => "i8",
    type_i16: $ => "i16",
    type_i32: $ => "i32",
    type_i64: $ => "i64",
    type_isize: $ => "isize",
    type_f32: $ => "f32",
    type_f64: $ => "f64", type_bool: $ => "bool",
    type_ok: $ => "ok",
    type_null: $ => "null",


    expression: $ => choice(
      $.postfix_expression,
      $.unary_expression,
      $.binary_expression,
      $.as_expression,
    ),

    primary_expression: $ => choice(
      "self",
      $.identifier,
      $.number,
      $.boolean,
      $.string,
      $.interpolated_string,
      $.parenthesized_expression,
      $.sizeof_expression,
      $.alignof_expression,
      $.offsetof_expression
    ),

    sizeof_expression: $ => seq(
      "sizeof",
      "(", $.type_annotation, ")"
    ),
    alignof_expression: $ => seq(
      "alignof",
      "(", $.type_annotation, ")"
    ),
    offsetof_expression: $ => seq(
      "offsetof",
      "(", $.type_annotation, ",", field("field", $.identifier), ")"
    ),

    as_expression: $ => prec(2, seq(
      $.expression,
      "as",
      $.type_annotation
    )),

    postfix_expression: $ => prec.left(12, seq(
      $.primary_expression,
      repeat(choice(
        $.field_access,
        $.type_access,
        $.generic_arguments,
        $.call_suffix,
        $.index_suffix,
      ))
    )),

    // Extracted postfix operations for easier highlighting
    field_access: $ => seq(".", optional("!"), field("field", $.identifier)),
    type_access: $ => seq("::", field("type", $.identifier)),
    call_suffix: $ => seq(optional("!"), "(", optional($.arguments), ")"),
    index_suffix: $ => seq("[", $.expression, "]"),

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
