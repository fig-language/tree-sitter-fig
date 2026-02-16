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

; PascalCase identifiers in paths are types
(path_segment (identifier) @type
 (#match? @type "^[A-Z]"))

; Lowercase identifiers in paths (not at end of function signature) are namespaces
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
  "pass"
  "packed"
  "where"
  "requires"
  "extends"
] @keyword

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
; This pattern uses anchoring to ensure we only match the final segment
(function_signature
  name: (path
    (path_segment (identifier) @function) .))

(function_signature
  name: (path
    (path_segment (builtin_namespace) @function) .))

; ==============================================================================
; TYPE DEFINITIONS
; ==============================================================================

; Struct definitions
(struct_definition
  name: (path
    (path_segment (identifier) @type)))

; Enum definitions
(enum_definition
  name: (path
    (path_segment (identifier) @type)))

; Union definitions
(union_definition
  name: (path
    (path_segment (identifier) @type)))

; Interface definitions
(interface_definition
  name: (path
    (path_segment (identifier) @type)))

; Type aliases
(type_statement
  name: (path
    (path_segment (identifier) @type)))

; ==============================================================================
; NAMESPACE DEFINITIONS
; ==============================================================================

(namespace_definition
  name: (path
    (path_segment (identifier) @module)))

; ==============================================================================
; GENERIC PARAMETERS
; ==============================================================================

(generic_parameter) @type.definition

(type_constraint
  (identifier) @type.definition)

; ==============================================================================
; VARIABLES, CONSTANTS, AND PARAMETERS
; ==============================================================================

; Variable declarations
(let_statement name: (identifier) @variable)
(mut_statement name: (identifier) @variable)

; Constants
(const_statement name: (identifier) @constant)

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

"self" @variable.builtin
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

