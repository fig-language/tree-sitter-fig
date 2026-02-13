; comments
(comment) @comment

; keywords
"fn" @keyword
"let" @keyword

; types
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
"=" @operator
":" @punctuation.delimiter
"," @punctuation.delimiter
"->" @operator

; literals
(number) @number
(string) @string
