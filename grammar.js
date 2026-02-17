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

  conflicts: $ => [
    [$.path_segment, $.primary_expression],
    [$.function_name_path]
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
      "namespace",
      field("name", $.name_path),
      optional(seq(
        $.newline,
        $.indent,
        repeat1($._statement),
        $.dedent
      )),
    ),

    function_definition: $ => seq(
      $.function_signature,
      $.newline,
      $.indent,
      optional($.where_clause),
      optional($.uses_clause),
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
      optional("extern"),
      "fn",
      optional("!"),
      optional($.generic_parameters),
      $.function_name_path,
      optional(seq("::", $.generic_parameters)),
      "(",
      optional($.parameters),
      ")",
      optional(seq("->", $.type_annotation))
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

    function_name_path: $ => choice(
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

    let_statement: $ => seq(
      "let",
      field("name", $.identifier),
      optional(seq(":", $.type_annotation)),
      "=",
      $.expression,
      $.newline
    ),

    mut_statement: $ => seq(
      "mut",
      field("name", $.identifier),
      optional(seq(":", $.type_annotation)),
      "=",
      $.expression,
      $.newline
    ),

    const_statement: $ => seq(
      "const",
      field("name", $.identifier),
      optional(seq(":", $.type_annotation)),
      "=",
      $.expression,
      $.newline
    ),

    type_statement: $ => seq(
      "type",
      field("name", $.name_path),
      "=",
      $.type_annotation,
      $.newline
    ),

    enum_definition: $ => seq(
      "enum",
      optional(seq("[", $.type_annotation, "]")),
      field("name", $.name_path),
      $.newline,
      $.indent,
      optional($.requires_clause),
      optional($.whitespace),
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
      "union",
      field("name", $.name_path),
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
      field("name", $.identifier),
      ":",
      $.type_annotation,
      $.newline
    ),

    struct_definition: $ => choice(
      // Empty struct - no body
      seq(
        optional("packed"),
        "struct",
        field("name", $.name_path),
      ),
      // Struct with body
      seq(
        optional("packed"),
        "struct",
        field("name", $.name_path),
        $.newline,
        $.indent,
        choice(
          // Clauses with fields (fields REQUIRED after clauses)
          seq(
            choice(
              $.requires_clause,
              $.where_clause,
              seq($.requires_clause, $.where_clause),
              seq($.where_clause, $.requires_clause)
            ),
            $.struct_field,
            repeat(seq($.whitespace, $.struct_field))
          ),
          // Just fields (no clauses)
          seq(
            optional($.whitespace),
            $.struct_field,
            repeat(seq($.whitespace, $.struct_field))
          )
        ),
        $.dedent
      )
    ),

    struct_field: $ => seq(
      field("name", $.identifier),
      ":",
      $.type_annotation,
      $.newline
    ),

    interface_definition: $ => choice(
      // Empty interface - no body
      seq(
        optional($.annotations),
        "interface",
        field("name", $.name_path),
      ),
      // Interface with body
      seq(
        optional($.annotations),
        "interface",
        field("name", $.name_path),
        $.newline,
        $.indent,
        choice(
          // Clauses with functions (functions REQUIRED after clauses)
          seq(
            choice(
              $.extends_clause,
              $.where_clause,
              seq($.extends_clause, $.where_clause),
              seq($.where_clause, $.extends_clause)
            ),
            $.function_declaration,
            repeat(seq($.whitespace, $.function_declaration))
          ),
          // Just functions (no clauses)
          seq(
            optional($.whitespace),
            $.function_declaration,
            repeat(seq($.whitespace, $.function_declaration))
          )
        ),
        $.dedent
      )
    ),

    uses_clause: $ => seq(
      "uses",
      choice(
        seq(
          $.newline,
          $.indent,
          repeat1($.resource),
          $.dedent
        ),
        seq(
          sep1($.path, ","),
          $.newline
        ),
      )
    ),
    resource: $ => seq($.path, $.newline),

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

    parameters: $ => sep1($.parameter, ","),

    parameter: $ => seq(field("name", $.identifier), ":", $.type_annotation),

    type_annotation: $ => choice(
      $.type_ptr,
      $.base_type,
    ),

    // Simple type annotation for use in type-prefixed paths
    // This version doesn't allow multi-segment paths (no ::)
    // Breaking the recursion: path → simple_type → path_segment (not path)
    simple_type_annotation: $ => choice(
      $.simple_type_ptr,
      $.simple_base_type,
    ),

    simple_base_type: $ => prec(1, seq(
      // Prefix array/slice operators (consistent with base_type)
      repeat(choice(
        seq("[", $.expression, "]"),  // array: [20]T
        seq("[", "]")                   // slice: []T
      )),
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
        $.simple_path,  // Single segment with optional generics
      ),
    )),

    simple_type_ptr: $ => seq(
      optional("?"),
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
      // Optional postfix array/slice operators (moved here to allow paths with generics)
      repeat(choice(
        seq("[", $.expression, "]"),  // array: T[20]
        seq("[", "]")                   // slice: T[]
      )),
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
        $.path,
      ),
    )),

    type_ptr: $ => seq(
      optional("?"),
      "*",
      optional("mut"),
      $.type_annotation
    ),

    generic_arguments: $ => seq('[', sep1($.type_annotation, ","), ']'),

    generic_parameters: $ => seq('[', sep1($.generic_parameter, ","), ']'),
    generic_parameter: $ => $.identifier,

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
