package tree_sitter_fig_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_fig "github.com/tree-sitter/tree-sitter-fig/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_fig.Language())
	if language == nil {
		t.Errorf("Error loading Fig grammar")
	}
}
