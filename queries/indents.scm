
; Increase indent after these nodes
[
  (function_definition)
  (struct_definition)
  (union_definition)
  (enum_definition)
  (interface_definition)
  (namespace_definition)
  (impl_block)
  (where_clause)
  (requires_clause)
  (extends_clause)
] @indent.begin

; Dedent on these tokens
[
  (dedent)
] @indent.dedent

; Align to the opening bracket
[
  "("
  "["
  "{"
] @indent.align
