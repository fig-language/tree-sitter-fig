; Scopes
[
  (function_definition)
  (impl_block)
  (namespace_definition)
  (where_clause)
  (source_file)
] @local.scope

; Definitions

; Function definitions
(function_definition
  (function_signature
    (path
      (path_segment
        (identifier) @local.definition.function))))

; Function definitions with type-prefixed paths
(function_definition
  (function_signature
    (path
      "::"
      (simple_type_annotation)
      (path_segment
        (identifier) @local.definition.function))))

; Parameters
(parameter
  (identifier) @local.definition.parameter)

; Let bindings
(let_statement
  (identifier) @local.definition.variable)

; Mut bindings
(mut_statement
  (identifier) @local.definition.variable)

; Const bindings
(const_statement
  (identifier) @local.definition.constant)

; Generic type parameters
(generic_parameters
  (identifier) @local.definition.type)

; Type definitions
(type_statement
  (path
    (path_segment
      (identifier) @local.definition.type))))

; Struct definitions
(struct_definition
  (path
    (path_segment
      (identifier) @local.definition.type))))

; Enum definitions
(enum_definition
  (path
    (path_segment
      (identifier) @local.definition.type))))

; Union definitions
(union_definition
  (path
    (path_segment
      (identifier) @local.definition.type))))

; Interface definitions
(interface_definition
  (path
    (path_segment
      (identifier) @local.definition.type))))

; Namespace definitions
(namespace_definition
  (path
    (path_segment
      (identifier) @local.definition.namespace))))

; References
(identifier) @local.reference
