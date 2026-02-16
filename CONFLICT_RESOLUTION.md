# Conflict Resolution: Eliminating [$.path] Recursion Conflict

## Problem Summary

The `[$.path]` conflict was caused by **recursive ambiguity**:

```
path → type_annotation → base_type → path (cycle!)
```

When parsing type-prefixed paths like `::Vec::Item::method()`, the parser couldn't determine:
- How much should `type_annotation` consume? (Vec? Vec::Item? Vec::Item::method?)
- Where does the type end and path continuation begin?

## Solution: Break the Cycle with `simple_type_annotation`

Instead of allowing `type_annotation` (which includes full `path` with `::`), we created a restricted version:

```javascript
// NEW: For type-prefixed paths only - no :: allowed inside
simple_type_annotation: $ => choice(
  $.simple_type_ptr,
  $.simple_base_type,
),

simple_base_type: $ => prec(1, seq(
  choice(
    // ... primitive types ...
    $.path_segment,  // ✅ Single segment only (no ::)
  ),
  repeat(choice(
    seq("[", $.expression, "]"),  // arrays
    seq("[", "]")                  // slices
  ))
)),

simple_type_ptr: $ => seq(
  optional("?"),
  "*",
  optional("mut"),
  $.simple_type_annotation  // ✅ Recursive but doesn't go through path
),

// Updated path rule
path: $ => choice(
  seq("::", $.simple_type_annotation, repeat1(seq("::", $.path_segment))),
  //         ^^^^^^^^^^^^^^^^^^^^^^^ Uses simple version
  seq($.path_segment, repeat(seq("::", $.path_segment)))
),
```

## The Cycle is Broken

**Before (infinite recursion):**
```
path 
  → type_annotation 
    → base_type 
      → path (back to start!)
```

**After (terminates):**
```
path 
  → simple_type_annotation 
    → simple_base_type 
      → path_segment (stops here)
```

## Result: ✅ Conflict Eliminated

```javascript
conflicts: $ => [
  [$.path_segment],  // Only 1 conflict remains (square bracket ambiguity)
  // [$.path],        // ✅ ELIMINATED!
],
```

## What Still Works

### ✅ Allowed Syntax

```nyx
// Type-prefixed with single-segment types
fn ::*T::clone(self: *T) -> *T
fn ::Vec[T]::push(self: *mut Vec[T], item: T)
fn ::u32::to_string(self: u32) -> String
fn ::?*mut T::as_ptr(self: ?*mut T) -> *T

// Regular multi-segment paths
fn std::io::print(msg: String)
fn Vec::Item::method()
fn std::collections::HashMap::new() -> HashMap
```

### ❌ Restriction

```nyx
// Type-prefixed with multi-segment type (NOT allowed)
fn ::Vec::Item::method()  // ❌ Error: Vec::Item not allowed in simple_type

// Workaround: Use regular namespaced path instead
fn Vec::Item::method()    // ✅ Works fine
```

## Trade-off Analysis

**Gained:**
- ✅ Eliminated `[$.path]` conflict
- ✅ One step closer to LALR(1) compatibility
- ✅ Clearer grammar semantics
- ✅ No ambiguity in type-prefixed paths

**Lost:**
- ❌ Can't write `::Vec::Item::whatever()` (must write `Vec::Item::whatever()`)
- (This is a minor limitation - associated types in type-prefixed paths)

**Verdict:** Excellent trade-off! The restriction is minimal and the use case is rare.

## Remaining Conflict: [$.path_segment]

This conflict remains due to square brackets `[` being used for:
1. Generic arguments: `Vec[T]`
2. Array types: `T[20]`
3. Array indexing: `arr[0]`

**To eliminate this:** Change `[T]` to `<T>` (angle brackets) for generics.
