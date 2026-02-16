; ==============================================================================
; COMMENTS
; ==============================================================================

(comment) @comment

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
  "impl"
  "pass"
  "packed"
  "where"
  "requires"
  "extends"
] @keyword

; ==============================================================================
; BUILT-IN VALUES
; ==============================================================================

"self" @variable.builtin
(builtin_namespace) @namespace.builtin

; ==============================================================================
; GENERIC FALLBACK (Must come early so specific rules can override)
; ==============================================================================

(identifier) @variable

; ==============================================================================
; BUILT-IN TYPES
; ==============================================================================

[
  (type_u8)
  (type_u16)
  (type_u32)
  (type_u64)
  (type_i8)
  (type_i16)
  (type_i32)
  (type_i64)
  (type_f32)
  (type_f64)
  (type_bool)
] @type.builtin

; ==============================================================================
; FUNCTIONS (Capture last segment only)
; ==============================================================================

; Function names - last path_segment in function signatures
; This includes both identifiers and builtin_namespace tokens used as function names
(function_signature
  (path
    (path_segment
      (identifier) @function
    )
  )
)

(function_signature
  (path
    (path_segment
      (builtin_namespace) @function
    )
  )
)

; Function calls with :: syntax
(postfix_expression
  (primary_expression)
  "::"
  (identifier) @function
)

; ==============================================================================
; NAMESPACES AND MODULES (Override function names for namespace parts)
; ==============================================================================

; In function signatures, all path_segments except the last should be @module
; This pattern matches path_segments in a path that has multiple segments
(function_signature
  (path
    (path_segment
      (identifier) @module
    )
    (path_segment)
  )
)

(function_signature
  (path
    (path_segment
      (builtin_namespace) @module
    )
    (path_segment)
  )
)

; Namespace definitions
(namespace_definition
  (path
    (path_segment
      (identifier) @module
    )
  )
)

; ==============================================================================
; TYPES
; ==============================================================================

; Types in type_annotation contexts
(type_annotation
  (base_type
    (path
      (path_segment
        (identifier) @type
      )
    )
  )
)

; Types in struct definitions
(struct_definition
  (path
    (path_segment
      (identifier) @type
    )
  )
)

; Types in enum definitions
(enum_definition
  (path
    (path_segment
      (identifier) @type
    )
  )
)

; Types in union definitions
(union_definition
  (path
    (path_segment
      (identifier) @type
    )
  )
)

; Types in interface definitions
(interface_definition
  (path
    (path_segment
      (identifier) @type
    )
  )
)

; Types in type statements
(type_statement
  (path
    (path_segment
      (identifier) @type
    )
  )
)

; Types in impl blocks
(impl_block
  (type_annotation
    (base_type
      (path
        (path_segment
          (identifier) @type
        )
      )
    )
  )
)

; Generic arguments - highlight the types inside
(generic_arguments
  (type_annotation
    (base_type
      (path
        (path_segment
          (identifier) @type
        )
      )
    )
  )
)

; Types in extends clause
(extends_clause
  (extension
    (path
      (path_segment
        (identifier) @type
      )
    )
  )
)

; Types in where clause bounds
(bound
  (path
    (path_segment
      (identifier) @type
    )
  )
)

; Types in requires clause
(requires_clause
  (requirement
    (path
      (path_segment
        (identifier) @type
      )
    )
  )
)

; ==============================================================================
; VARIABLES AND PARAMETERS
; ==============================================================================

(parameter
  (identifier) @variable.parameter
)

(const_statement
  (identifier) @constant
)

(generic_parameters
  (identifier) @type.definition
)

(type_constraint
  (identifier) @type.definition
)

; ==============================================================================
; ENUM, UNION, AND STRUCT MEMBERS
; ==============================================================================

(enum_variant
  (identifier) @constant
)

(union_variant
  (identifier) @variable.member
)

(struct_field
  (identifier) @variable.member
)

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
  "{"
  "}"
] @punctuation.bracket

; ==============================================================================
; LITERALS
; ==============================================================================

(number) @number
(boolean) @boolean
(string) @string
(interpolated_string) @string
