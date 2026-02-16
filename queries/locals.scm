; Scopes
[
  (function_definition)
  (namespace_definition)
  (where_clause)
  (source_file)
] @local.scope

; Definitions

; Function definitions
(function_definition
  (function_signature
    name: (simple_path
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
(generic_parameter
  (identifier) @local.definition.type)

; Type definitions
(type_statement
  (simple_path
    (path_segment
      (identifier) @local.definition.type)))

; Struct definitions
(struct_definition
  (simple_path
    (path_segment
      (identifier) @local.definition.type)))

; Enum definitions
(enum_definition
  (simple_path
    (path_segment
      (identifier) @local.definition.type)))

; Union definitions
(union_definition
  (simple_path
    (path_segment
      (identifier) @local.definition.type)))

; Interface definitions
(interface_definition
  (simple_path
    (path_segment
      (identifier) @local.definition.type)))

; Namespace definitions
(namespace_definition
  (simple_path
    (path_segment
      (identifier) @local.definition.namespace)))

; References
(identifier) @local.reference
