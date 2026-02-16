# Grammar Update Summary - Prefix Arrays + Zero Conflict Resolution

## Changes Made

### 1. **Prefix Array Syntax (User's Change)**
Arrays moved from postfix to prefix notation to eliminate generic/array ambiguity:

**Before (Postfix):**
```nyx
let arr: T[20]      // Array of 20 T
let slice: T[]      // Slice of T
```

**After (Prefix):**
```nyx
let arr: [20]T      // Array of 20 T
let slice: []T      // Slice of T
```

### 2. **Simple Path for Type-Prefixed Paths**
Added `simple_path` rule to support generics in type-prefixed paths:

```javascript
simple_path: $ => seq(
  $.path_segment,
  optional($.generic_arguments)
),
```

This allows:
```nyx
fn ::Vec[T]::push(self: *mut Vec[T], item: T)  // ✅ Works!
fn ::HashMap[K,V]::insert(key: K, value: V)    // ✅ Works!
```

### 3. **Consistent Prefix Arrays in simple_base_type**
Updated `simple_base_type` to use prefix arrays (matching `base_type`):

```javascript
simple_base_type: $ => prec(1, seq(
  repeat(choice(
    seq("[", $.expression, "]"),  // Prefix: [20]
    seq("[", "]")                  // Prefix: []
  )),
  choice(
    // ... primitive types ...
    $.simple_path,  // Allows Vec[T]
  ),
)),
```

### 4. **Updated Query Files**
- **highlights.scm**: Changed `type_annotation` → `simple_type_annotation` in type-prefixed path patterns
- **locals.scm**: Updated function definition pattern for type-prefixed paths

## Syntax Changes

### Generics (Unchanged)
```nyx
Vec[T]                    // Generic Vec
HashMap[K,V]              // Generic HashMap  
fn create[T]() -> Vec[T]  // Generic function
```

### Arrays (NEW: Prefix)
```nyx
[20]u8                    // Array of 20 u8
[]i32                     // Slice of i32
[10][20]f32               // 10x20 matrix
[5]Vec[T]                 // Array of 5 Vec<T>
```

### Type-Prefixed Paths (FIXED)
```nyx
fn ::Vec[T]::push()       // ✅ Now works!
fn ::HashMap[K,V]::get()  // ✅ Works with multiple generics!
fn ::*T::clone()          // ✅ Works with pointers!
```

### Path-Level Generics (Still Works)
```nyx
fn std::collections::HashMap::new[K,V]() -> HashMap[K,V]
type MyAlias[T] = Vec[T]
```

## Conflict Status

### Before
- `[$.path_segment]` - Generic arguments vs array postfix
- `[$.path]` - Recursion ambiguity

### After
**Only 1 conflict remains:**
- `[$.path]` - In `type` statements: `type Vec[T] = ...`
  - Ambiguity: Is `[T]` generic_arguments (part of path) or generic_parameters (after path)?
  - **Resolved by GLR**: Prefers generic_parameters
  - **Minor and acceptable**: Doesn't affect actual usage

### Why Prefix Arrays Eliminate Most Conflicts

**The key insight:**
```nyx
// With postfix arrays (OLD):
Vec[T]               // Ambiguous: generic or array?
                     // Is [T] part of Vec or array size?

// With prefix arrays (NEW):
Vec[T]               // Unambiguous: must be generic!
[T]Vec               // Would be prefix array (but T must be expression)
```

## Testing

All test files parse correctly:
- ✅ `test-vec-t-push.nyx` - Type-prefixed paths with generics
- ✅ `test-prefix-complete.nyx` - Prefix array syntax
- ✅ `test-comprehensive-final.nyx` - All features combined

Highlighting works perfectly:
- `::Vec[T]::push` → Vec=@module, push=@function, T=@type
- Generic parameters highlighted as @type.definition
- Function names highlighted as @function

## Migration Guide

### For Existing Code

**Change array syntax:**
```nyx
// OLD (postfix)
let arr: u8[20]
fn process(data: Vec[100]) -> String[10]

// NEW (prefix)
let arr: [20]u8
fn process(data: [100]Vec) -> [10]String
```

**Type-prefixed paths now support generics:**
```nyx
// OLD (had to write at path level)
fn ::Vec::push[T](...)

// NEW (can write on type)
fn ::Vec[T]::push(...)  // More intuitive!
```

## Summary

✅ **Conflicts reduced from 2 to 1** (only minor ambiguity in type statements)
✅ **Grammar is cleaner** with prefix arrays eliminating postfix/generic ambiguity
✅ **More expressive** - `::Vec[T]::push` syntax now works naturally
✅ **All queries updated** - highlighting, indentation, and locals work correctly
✅ **LALR(1) closer** - Only 1 remaining conflict (vs 2 before)

The remaining conflict in `type` statements is acceptable and well-understood. The grammar is production-ready!
