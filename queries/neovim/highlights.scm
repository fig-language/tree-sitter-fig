; comments
(comment) @comment

; keywords
"fn" @keyword
"let" @keyword
"const" @keyword
"if" @keyword
"else" @keyword
"match" @keyword
"while" @keyword
"for" @keyword
"in" @keyword
"return" @keyword
"break" @keyword
"continue" @keyword
"struct" @keyword
"enum" @keyword
"interface" @keyword
"requires" @keyword
"where" @keyword
"union" @keyword
"mut" @keyword
"type" @keyword
"pub" @keyword
"as" @keyword


; types
"Self" @type
(type_u8) @type
(type_u16) @type
(type_u32) @type
(type_u64) @type
(type_i8) @type
(type_i16) @type
(type_i32) @type
(type_i64) @type
(type_f32) @type
(type_f64) @type
(type_bool) @type
(type_annotation (identifier) @type)

; identifiers
(identifier) @variable

; functions
(function_definition
  (identifier) @function
)
(call_expression
  (identifier) @function.call
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
"=>" @operator
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
"+=" @operator
"-=" @operator
"*=" @operator
"/=" @operator
"%=" @operator
"&=" @operator
"|=" @operator
"^=" @operator
"~=" @operator
"<<=" @operator
">>=" @operator


; literals
(number) @number
(string) @string
