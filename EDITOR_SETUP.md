# Nyx Tree-Sitter Editor Integration

## Neovim Setup

### Comment String Configuration

To enable commenting with `gc` operator in Neovim, you need to set the `commentstring` option for Nyx files.

**Option 1: Using ftplugin (Recommended)**

Create a file at `~/.config/nvim/after/ftplugin/nyx.lua` with the content from [editor-config/nvim-ftplugin-nyx.lua](editor-config/nvim-ftplugin-nyx.lua):

```lua
vim.bo.commentstring = "// %s"
```

**Option 2: In your init.lua/init.vim**

Add to your Neovim configuration:

```lua
vim.api.nvim_create_autocmd("FileType", {
  pattern = "nyx",
  callback = function()
    vim.bo.commentstring = "// %s"
  end,
})
```

**Option 3: Using nvim-treesitter**

If you're using [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter), add this to your tree-sitter config:

```lua
require('nvim-treesitter.configs').setup {
  -- ... other config
  
  -- Add Nyx parser
  ensure_installed = { "nyx" },
  
  -- Optional: Configure additional modules
  highlight = { enable = true },
  indent = { enable = true },
}

-- Set commentstring separately
vim.api.nvim_create_autocmd("FileType", {
  pattern = "nyx",
  callback = function()
    vim.bo.commentstring = "// %s"
  end,
})
```

### Registering the Parser

To use this tree-sitter parser in Neovim, you need to tell nvim-treesitter where to find it:

```lua
local parser_config = require("nvim-treesitter.parsers").get_parser_configs()
parser_config.nyx = {
  install_info = {
    url = "path/to/tree-sitter-nyx", -- local path or github url
    files = {"src/parser.c", "src/scanner.c"},
    branch = "main",
    generate_requires_npm = false,
    requires_generate_from_grammar = false,
  },
  filetype = "nyx",
}
```

### File Type Detection

Add to your Neovim config to automatically detect `.nyx` files:

```lua
vim.filetype.add({
  extension = {
    nyx = "nyx",
  },
})
```

## VSCode Setup

For VSCode, you would need to create a language extension. The tree-sitter grammar can be used as a base for the TextMate grammar conversion.

### Basic VSCode Language Definition

Create a `syntaxes/nyx.tmLanguage.json` or use the tree-sitter-cli to convert the grammar.

## Tree-Sitter Query Files

This parser includes the following query files:

- **highlights.scm** - Syntax highlighting rules
- **indents.scm** - Indentation rules  
- **locals.scm** - Scope and definition tracking for semantic features
- **folds.scm** - Code folding markers (generated)

## Grammar Features

The Nyx tree-sitter parser supports:

- ✅ Type-prefixed function paths: `fn ::*T::method(...)` 
- ✅ Namespace paths: `fn std::io::print(...)`
- ✅ Generic parameters: `struct Vec[T]`
- ✅ Impl blocks: `impl[T] : Vec[T]`
- ✅ Where clauses with type constraints
- ✅ Indentation-sensitive parsing
- ✅ Square bracket generics with postfix array syntax

## Conflicts

The parser currently has **2 conflicts**:

1. `[$.path_segment]` - Ambiguity between `Vec` and `Vec[T]` (unavoidable with square bracket generics)
2. `[$.path]` - Path parsing ambiguity    

These are acceptable for tree-sitter's GLR parsing but would need to be resolved for LALR(1) parsers like LALRPOP (use angle brackets `<T>` for generics in production).

## Testing

Test the parser:

```bash
tree-sitter parse examples/example-file.nyx
tree-sitter highlight test-highlighting.nyx
tree-sitter query queries/highlights.scm test-highlighting.nyx
```
