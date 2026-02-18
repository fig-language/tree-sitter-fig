; ==============================================================================
; COMMENTS
; ==============================================================================

(comment) @comment

; ==============================================================================
; IDENTIFIER CONVENTIONS
; ==============================================================================


; All-caps identifiers are constants
((identifier) @constant
 (#match? @constant "^[A-Z][A-Z\\d_]*$"))

; PascalCase identifiers are types
((identifier) @type
  (#match? @type "^[A-Z]"))

; Lowercase identifiers in path segments (modules/namespaces)
(path_segment (identifier) @module
  (#match? @module "^[a-z]"))

(annotation
  name: (identifier) @attribute
)

; ==============================================================================
; KEYWORDS
; ==============================================================================

[
  "extern"
  "fn"
  "let"
  "mut"
  "const"
  "type"
  "enum"
  "union"
  "struct"
  "interface"
  "namespace"
  "using"
  "pass"
  "packed"
  "where"
  "requires"
  "extends"
  "for"
  "while"
  "in"
  "return"
  "as"
  "if"
  "elif"
  "else"
] @keyword

; ==============================================================================
; GENERIC PARAMETERS
; =============================================================================

; Generic type parameters (in function/struct/interface/etc definitions)
(generic_parameter (identifier) @type.definition)

(type_constraint (identifier) @type.definition)

; ==============================================================================
; FUNCTION CALLS
; ==============================================================================

; Method calls: obj.method()
(postfix_expression
  (field_access field: (identifier) @function.method)
  (call_suffix))

; Type method calls: obj::method()
(postfix_expression
  (type_access type: (identifier) @function.method)
  (call_suffix))

; Direct function calls would need a call_expression node that wraps identifier()
; For now, this covers method-style calls

; ==============================================================================
; FUNCTION DEFINITIONS
; ==============================================================================

; Function names - only the LAST path segment in function signatures

; Special function names
(function_signature
  (type_name_path
    name: (path_segment
            (identifier) @function.builtin
            (#match? @function.builtin "^(new|from|into)$"))))

(function_signature
  (type_name_path
    name: (segment_with_generics
            (path_segment
              (identifier) @function.builtin
              (#match? @function.builtin "^(new|from|into)$")))))

; This pattern uses anchoring to ensure we only match the final segment
(function_signature
  (type_name_path 
    name: (segment_with_generics
      (path_segment
        (identifier) @function 
        (#not-match? @function "^(new|from|into)$")))))

(function_signature
  (type_name_path 
    name: (path_segment
      (identifier) @function
      (#not-match? @function "^(new|from|into)$"))))

(function_signature
  (type_name_path
    (path_segment (builtin_namespace) @module) .))

; ==============================================================================
; NAMESPACE DEFINITIONS
; ==============================================================================

(namespace_definition
  name: (name_path
    (path_segment (identifier) @module)))

(namespace_definition
  name: (name_path
    name: (path_segment (identifier) @module )))

; ==============================================================================
; VARIABLES, CONSTANTS, AND PARAMETERS
; ==============================================================================

; Variable declarations
(let_statement name: (identifier) @variable)
(mut_statement name: (identifier) @variable)

; Constants
; (const_statement name: (identifier) @constant)
(const_statement
  (type_name_path
    name: (segment_with_generics
            (path_segment
              (identifier) @constant ))))

; Function parameters
(parameter name: (identifier) @variable.parameter)

; Enum variants
(enum_variant name: (identifier) @constant)

; Union variants
(union_variant name: (identifier) @variable.member)

; Struct fields
(struct_field name: (identifier) @variable.member)

; ==============================================================================
; FIELD ACCESS
; ==============================================================================

; Field access (not followed by call)
(field_access field: (identifier) @variable.member)

; Type access (not followed by call)  
(type_access type: (identifier) @variable.member)

; ==============================================================================
; BUILT-IN VALUES AND TYPES
; ==============================================================================

"sizeof" @function.builtin
"self" @variable.builtin
((identifier) @variable.builtin
  (#eq? @variable.builtin "self"))

(builtin_namespace) @module.builtin

[
  (type_u8)
  (type_u16)
  (type_u32)
  (type_u64)
  (type_usize)
  (type_i8)
  (type_i16)
  (type_i32)
  (type_i64)
  (type_isize)
  (type_f32)
  (type_f64)
  (type_bool)
  (type_ok)
  (type_null)
] @type.builtin

; ==============================================================================
; OPERATORS
; ==============================================================================

[
  "="
  "::"
  "."
  "->"
  "?"
  "+"
  "-"
  "*"
  "/"
  "%"
  "=="
  "!="
  "<"
  ">"
  "<="
  ">="
  "&&"
  "||"
  "!"
  "&"
  "|"
  "^"
  "~"
  "<<"
  ">>"
] @operator

; ==============================================================================
; PUNCTUATION
; ==============================================================================

[
  ":"
  ","
] @punctuation.delimiter

[
  "("
  ")"
  "["
  "]"
] @punctuation.bracket

[
  "{"
  "}"
  "#"
] @punctuation.special

; ==============================================================================
; LITERALS
; ==============================================================================

(number) @number
(boolean) @constant.builtin
(string) @string
(interpolated_string) @string

