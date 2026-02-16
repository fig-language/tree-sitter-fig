# Solving [$.path_segment] Conflict Without Changing `[T]` Syntax

## The Conflict: Detailed Analysis

### The Grammar Clash

Two rules compete to consume `[...]` after an identifier:

```javascript
// Rule 1: path_segment wants [T] for generics
path_segment: $ => seq(
  identifier,
  optional($.generic_arguments)  // ← Wants to consume [T]
),

// Rule 2: base_type wants [T] for array types
base_type: $ => seq(
  $.path,
  repeat(seq("[", $.expression, "]"))  // ← Also wants to consume [T]
),
```

### Example of Actual Ambiguity

```nyx
let x: Vec[T]
```

**Two valid parse trees:**

**Parse A** (Generic):
```
type_annotation
  └── base_type
      └── path
          └── path_segment
              ├── identifier: "Vec"
              └── generic_arguments
                  └── type_annotation: "T"
```

**Parse B** (Array):
```
type_annotation
  └── base_type
      ├── path
      │   └── path_segment
      │       └── identifier: "Vec"
      └── array_postfix
          └── expression: "T"
```

Both are syntactically valid! The parser cannot distinguish between:
- `Vec` with generic type parameter `T`
- `Vec` as array with size `T`

---

## Solution 1: Move Generics to Path Level ⭐ RECOMMENDED

**Idea:** Generics belong to the COMPLETE path, not individual segments.

### Grammar Changes

```javascript
// NO generics in path_segment
path_segment: $ => choice($.identifier, $.builtin_namespace),

// Generics only at the END of complete path
path: $ => seq(
  choice(
    seq("::", $.simple_type_annotation, repeat1(seq("::", $.path_segment))),
    seq($.path_segment, repeat(seq("::", $.path_segment)))
  ),
  optional($.generic_arguments)  // ✅ Only here, not in segments!
),
```

### What Changes

**Before (per-segment generics):**
```nyx
Vec[T]::Item::new()     // ERROR: Can't continue path after generics
HashMap[K,V]::Entry     // ERROR: Same problem
```

**After (path-level generics):**
```nyx
Vec::Item::new[T]()     // ✅ Generics at end
HashMap::Entry[K,V]     // ✅ Generics at end
Vec[T]                  // ✅ Still works (single segment)
std::Vec[T]             // ✅ Still works
```

### Examples

```nyx
// ✅ All these work perfectly
let x: Vec[T]
let y: std::collections::HashMap[K,V]
let z: Vec[T][]                        // Array of Vec[T]
fn create() -> Vec[T]

// ✅ Method calls
fn std::io::print(msg: String)
fn Vec::new[T]() -> Vec[T]

// ✅ Type-prefixed paths
fn ::*T::clone(self: *T) -> *T
fn ::Vec::push[T](self: *mut Vec[T], item: T)

// ❌ These don't work (but rarely needed)
// Vec[T]::Item      // Must write: Vec::Item[T]
// HashMap[K,V]::Entry  // Must write: HashMap::Entry[K,V]
```

### Conflict Status: ✅ ELIMINATED

No conflict because:
- `path_segment` never has generics → no ambiguity with identifier
- `path` has generics at the end → unambiguous position
- Array postfix in `base_type` comes AFTER path is complete

---

## Solution 2: Require Separator Before Generics

**Idea:** Add a sigil that signals "generics coming".

### Grammar Changes

```javascript
path_segment: $ => seq(
  choice($.identifier, $.builtin_namespace),
  optional(seq("@", $.generic_arguments))  // @ prefix for generics
),
```

### Syntax Examples

```nyx
// Before:
let x: Vec[T]
fn HashMap[K,V]::new() -> HashMap[K,V]

// After:
let x: Vec@[T]
fn HashMap@[K,V]::new() -> HashMap@[K,V]

// Arrays remain unchanged:
let arr: Vec[20]      // Array of 20 Vecs (no @)
let gen: Vec@[T]      // Generic Vec of T (with @)
```

### Conflict Status: ✅ ELIMINATED

When parser sees:
- `Vec[` → Array type (no @)
- `Vec@[` → Generic arguments (has @)

Completely unambiguous!

**Pros:**
- Clear visual distinction
- Zero conflicts
- All syntax patterns work

**Cons:**
- New syntax unfamiliar to users
- Slightly more verbose

---

## Solution 3: Different Brackets for Arrays vs Generics

**Idea:** Use `[T]` for generics, `(T)` for arrays.

### Grammar Changes

```javascript
base_type: $ => seq(
  choice(/* ... */, $.path),
  repeat(choice(
    seq("(", $.expression, ")"),  // array: T(20) instead of T[20]
    seq("(", ")")                  // slice: T() instead of T[]
  ))
),
```

### Syntax Examples

```nyx
// Generics use []:
let x: Vec[T]
let y: HashMap[K,V]

// Arrays use ():
let arr: Vec(20)        // Array of 20 Vecs
let slice: Vec()        // Slice of Vecs
let matrix: T(10)(20)   // 10x20 array

// Combined:
let arr_gen: Vec[T](20)  // Array of 20 Vec<T>
```

### Conflict Status: ✅ ELIMINATED

Different brackets = different meanings = no ambiguity!

**Pros:**
- Generics keep `[T]` syntax
- Visually distinct
- Zero conflicts

**Cons:**
- Arrays using `()` is unusual
- Looks like function calls

---

## Solution 4: Forbid Expression-Type Arrays, Add Built-in Array Type

**Idea:** Remove `T[expr]` syntax, use `Array[T, size]` instead.

### Grammar Changes

```javascript
base_type: $ => seq(
  choice(
    // ... primitives ...
    $.path,
  ),
  // Remove this:
  // repeat(seq("[", $.expression, "]"))
),

// Array is just a generic type
// Array[u8, 20]  -- array of 20 u8s
// Array[T]       -- slice of T
```

### Syntax Examples

```nyx
// Generics:
let x: Vec[T]                 // ✅ Generic Vec

// Arrays:
let arr: Array[u8, 20]        // ✅ Array of 20 u8s
let slice: Array[T]           // ✅ Slice of T
let matrix: Array[Array[u8, 10], 5]  // ✅ 2D array

// No postfix arrays:
// let bad: T[20]             // ❌ Removed
```

### Conflict Status: ✅ ELIMINATED

Only one meaning for `[...]` after identifier = generics!

**Pros:**
- Generics keep `[T]` syntax
- More consistent (Array is just another generic type)
- Zero conflicts

**Cons:**
- More verbose for arrays
- Changes existing array syntax significantly

---

## Solution 5: Context-Aware Disambiguation via Precedence

**Idea:** Use dynamic precedence to prefer generics over arrays.

### Grammar Changes

```javascript
path_segment: $ => prec.dynamic(2, seq(  // Higher precedence
  choice($.identifier, $.builtin_namespace),
  optional($.generic_arguments)
)),

base_type: $ => seq(
  choice(/* ... */, $.path),
  repeat(prec.dynamic(1, choice(  // Lower precedence
    seq("[", $.expression, "]"),
    seq("[", "]")
  )))
),
```

### How It Works

When parser sees `Vec[T]`:
1. Try high-precedence interpretation (generics) first
2. Fall back to low-precedence (array) if it fails

This is essentially codifying the resolution strategy.

### Conflict Status: ⚠️ MARKED AS ACCEPTED

The conflict still exists in the grammar, but tree-sitter resolves it automatically by precedence.

**Pros:**
- Syntax unchanged
- Conflict "handled" rather than eliminated

**Cons:**
- Conflict still exists (just resolved)
- Not a true elimination
- Doesn't help with LALR(1) compatibility

---

## Solution 6: Lookahead-Based Disambiguation

**Idea:** Use grammar structure to force lookahead that distinguishes cases.

### Grammar Changes

```javascript
path_segment: $ => seq(
  choice($.identifier, $.builtin_namespace),
  optional($.generic_arguments_strict)
),

// Strict version: Must have comma or valid type ending
generic_arguments_strict: $ => seq(
  '[',
  choice(
    seq($.type_annotation, ',', sep1($.type_annotation, ",")),  // Multiple args
    seq($.type_annotation, &']')  // Single arg followed by ]
  ),
  ']'
),

// Arrays require expression that's NOT a simple identifier
base_type: $ => seq(
  choice(/* ... */, $.path),
  repeat(seq("[", $.array_size_expression, "]"))
),

array_size_expression: $ => choice(
  $.number,                    // [10]
  $.string,                    // ["size"]
  $.binary_expression,         // [N+1]
  seq("(", $.expression, ")"), // [(T)]  parenthesized if just identifier
),
```

### What This Achieves

Forces disambiguation:
```nyx
Vec[T]        // T is simple identifier → must be generic
Vec[T+1]      // T+1 is binary expression → must be array
Vec[(T)]      // Parenthesized → must be array
Vec[10]       // Number → must be array
```

### Conflict Status: ❌ PARTIAL SOLUTION

Reduces conflicts but doesn't eliminate them completely.

---

## Recommended Solution: #1 (Path-Level Generics)

**Implementation Strategy:**
1. Remove `optional($.generic_arguments)` from `path_segment`
2. Add `optional($.generic_arguments)` to `path` at the end
3. Update all paths to have generics at the end

**Migration Required:**
```nyx
// Old → New
HashMap[K,V]::Entry    → HashMap::Entry[K,V]
Vec[T]::Item           → Vec::Item[T]
Option[T]::unwrap()    → Option::unwrap[T]()
```

Most code doesn't use these patterns, so migration is minimal!

**Result:** Zero conflicts, keeps `[T]` syntax, LALR(1) compatible! ✅
