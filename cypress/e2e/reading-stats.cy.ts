describe("Reading Stats", () => {
  beforeEach(() => {
    // Visit the main page with the editor
    cy.visit("/")
  })

  it("displays initial reading stats with zeros", () => {
    // Clear the editor to ensure we start with empty content
    cy.get("textarea").clear()

    // Check that reading stats display zeros
    cy.contains("Reading Time: 0 min read")
    cy.contains("Words: 0")
    cy.contains("Sentences: 0")
  })

  it("updates reading stats in real-time when typing", () => {
    // Clear the editor
    cy.get("textarea").clear()

    // Type a sentence
    cy.get("textarea").type("This is a test sentence.")

    // Check that stats updated
    cy.contains("Words: 5")
    cy.contains("Sentences: 1")

    // Type another sentence
    cy.get("textarea").type(" This is another test sentence.")

    // Check that stats updated again
    cy.contains("Words: 10")
    cy.contains("Sentences: 2")

    // Check reading time (should be at least 1 min)
    cy.contains("Reading Time: 1 min read")
  })

  it("handles multi-line content correctly", () => {
    // Clear the editor
    cy.get("textarea").clear()

    // Type multiple lines with different sentence endings
    cy.get("textarea").type(
      "First line, first sentence. First line, second sentence!\nSecond line? Third line."
    )

    // Check counts
    cy.contains("Words: 13")
    cy.contains("Sentences: 4")
  })

  it("correctly displays reading time for longer content", () => {
    // Clear the editor
    cy.get("textarea").clear()

    // Create content with approximately 300 words (using a repeated sentence)
    const sentence = "This is a test sentence with exactly ten words. "
    let longText = ""
    for (let i = 0; i < 30; i++) {
      longText += sentence
    }

    // Type the long text (using invoke to avoid extremely slow typing)
    cy.get("textarea").invoke("val", longText).trigger("input")

    // Check stats
    cy.contains("Words: 300") // 10 words × 30 repetitions
    cy.contains("Sentences: 30") // 1 sentence × 30 repetitions
    cy.contains("Reading Time: 2 min read") // 300 words ÷ 200 WPM = 1.5 min → 2 min (rounded up)
  })
})