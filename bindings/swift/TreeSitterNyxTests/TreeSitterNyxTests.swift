import XCTest
import SwiftTreeSitter
import TreeSitterNyx

final class TreeSitterNyxTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_nyx())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Nyx grammar")
    }
}
