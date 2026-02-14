; comments
(comment) @comment

; keywords
"fn" @keyword
"let" @keyword
"type" @keyword
"const" @keyword
"raw" @keyword
"enum" @keyword
"union" @keyword
"struct" @keyword
"interface" @keyword
"namespace" @keyword
"pass" @keyword
; "if" @keyword
; "else" @keyword
; "match" @keyword
; "while" @keyword
; "for" @keyword
; "in" @keyword
; "return" @keyword
; "break" @keyword
; "continue" @keyword
; "requires" @keyword
; "where" @keyword
; "mut" @keyword
; "pub" @keyword
; "as" @keyword


; types
; "Self" @type
(type_u8) @type.builtin
(type_u16) @type.builtin
(type_u32) @type.builtin
(type_u64) @type.builtin
(type_i8) @type.builtin
(type_i16) @type.builtin
(type_i32) @type.builtin
(type_i64) @type.builtin
(type_f32) @type.builtin
(type_f64) @type.builtin
(type_bool) @type.builtin

; identifiers
(identifier) @variable

; functions
(function_signature
  (identifier_path
  name: (_) @function
    )
)
(path_segment
  (identifier) @module
)
(type_identifier_path
  (identifier_path
    name: (_) @type
  )
)

(call_expression
  (identifier) @function.call
)
(parameter
  (identifier) @variable.parameter
)

(const_statement
  (identifier) @constant
)

(generic_parameters
  (identifier) @type.definition
)

(generic_arguments
  (type_annotation) @type.argument
)
(named
  (identifier) @type
)

(enum_variant
  (identifier) @constant
)

(union_variant
  (identifier) @variable.member
)

(struct_field
  (identifier) @variable.member
)

(namespace_definition
  (identifier_path
    name: (_) @module
  )
)

; punctuation
"(" @punctuation.bracket
")" @punctuation.bracket
"[" @punctuation.bracket
"]" @punctuation.bracket
"{" @punctuation.bracket
"}" @punctuation.bracket
"=" @operator
"::" @operator
":" @punctuation.delimiter
"," @punctuation.delimiter
"->" @operator
; "=>" @operator
"+" @operator
"-" @operator
"*" @operator
"/" @operator
"%" @operator
"==" @operator
"!=" @operator
"<" @operator
">" @operator
"<=" @operator
">=" @operator
"&&" @operator
"||" @operator
"!" @operator
"&" @operator
"|" @operator
"^" @operator
"~" @operator
"<<" @operator
">>" @operator
; "+=" @operator
; "-=" @operator
; "*=" @operator
; "/=" @operator
; "%=" @operator
; "&=" @operator
; "|=" @operator
; "^=" @operator
; "~=" @operator
; "<<=" @operator
; ">>=" @operator


; literals
(number) @number
(string) @string
(interpolated_string) @string
(boolean) @boolean
