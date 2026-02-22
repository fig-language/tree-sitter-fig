-- Neovim filetype plugin for Fig
-- Place this file in: ~/.config/nvim/ftplugin/fig.lua
-- Or in your Neovim config under: after/ftplugin/fig.lua

-- Set comment string for commenting/uncommenting with 'gc' operator
vim.bo.commentstring = "// %s"

-- Additional Fig-specific settings
vim.bo.expandtab = true
vim.bo.shiftwidth = 4
vim.bo.tabstop = 4
vim.bo.softtabstop = 4

-- Enable tree-sitter folding if desired
-- vim.wo.foldmethod = "expr"
-- vim.wo.foldexpr = "nvim_treesitter#foldexpr()"
