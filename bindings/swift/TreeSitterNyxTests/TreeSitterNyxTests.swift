import XCTest
import SwiftTreeSitter
import TreeSitterFig

final class TreeSitterFigTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_fig())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Fig grammar")
    }
}
