package tree_sitter_nyx_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_nyx "github.com/tree-sitter/tree-sitter-nyx/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_nyx.Language())
	if language == nil {
		t.Errorf("Error loading Nyx grammar")
	}
}
