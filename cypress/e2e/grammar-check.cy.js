/// <reference types="cypress" />

describe('Grammar Checking Functionality', () => {
  beforeEach(() => {
    cy.visit('/')
    
    // Intercept grammar service API calls to provide mock responses
    cy.intercept('POST', '**/v2/check', {
      statusCode: 200,
      body: {
        language: {
          name: "English (US)",
          code: "en-US"
        },
        matches: [
          {
            message: "This is a spelling mistake",
            shortMessage: "Spelling mistake",
            offset: 10,  // Position after "This is a "
            length: 7,   // Length of "speling"
            replacements: [
              { value: "spelling" }
            ],
            context: {
              text: "This is a speling mistake.",
              offset: 10,
              length: 7
            },
            rule: {
              id: "SPELLING_ERROR",
              description: "Spelling rule description",
              issueType: "misspelling"
            }
          }
        ]
      }
    }).as('grammarCheck')
    
    // Intercept Grazie API calls if used
    cy.intercept('POST', '**/user/v5/gec/correct/v3', {
      statusCode: 200,
      body: {
        corrections: [
          {
            sentence: "This is a speling mistake.",
            language: "en",
            problems: [
              {
                info: {
                  id: { id: "spell.en.spelling" },
                  category: "SPELLING",
                  service: "SPELL",
                  displayName: "Incorrect spelling",
                  confidence: "HIGH"
                },
                message: "Incorrect spelling",
                highlighting: {
                  always: {
                    start: 10,
                    endExclusive: 17
                  },
                  onHover: []
                },
                fixes: [
                  {
                    parts: [
                      {
                        type: "Change",
                        range: {
                          start: 10,
                          endExclusive: 17
                        },
                        text: "spelling"
                      }
                    ],
                    batchId: "Spell:speling->spelling"
                  }
                ]
              }
            ]
          }
        ]
      }
    }).as('grazieCheck')
  })

  it('should check grammar and display errors without console errors', () => {
    // Start with a clean slate to monitor console errors
    cy.window().then((win) => {
      cy.spy(win.console, 'error').as('consoleError')
    })
    
    // Type text with deliberate error
    cy.get('[data-testid="markdown-input"]')
      .clear()
      .type('This is a speling mistake.')
    
    // Wait for the grammar check to be triggered
    cy.wait('@grammarCheck', { timeout: 10000 }).then(() => {
      // Wait for error highlights to render
      cy.get('.grammar-error').should('exist')
      
      // Verify no console errors occurred (specifically related to invalid offsets)
      cy.get('@consoleError').should((spy) => {
        const invalidOffsetErrors = spy.getCalls().filter(
          call => call.args.some(arg => 
            typeof arg === 'string' && arg.includes('Invalid offset')
          )
        )
        expect(invalidOffsetErrors.length).to.equal(0)
      })
    })
  })
  
  it('should handle grammar errors in different markdown structures', () => {
    // Start with clean console
    cy.window().then((win) => {
      cy.spy(win.console, 'error').as('consoleError')
    })
    
    // Type markdown with varied content
    const markdownContent = `# Heading with speling error

This paragraph has a speling mistake.

- List with speling error
- Another item

\`\`\`
Code block (should be ignored)
\`\`\`

> Blockquote with speling error.`
    
    cy.get('[data-testid="markdown-input"]')
      .clear()
      .type(markdownContent)
    
    // Wait for grammar check
    cy.wait('@grammarCheck', { timeout: 10000 })
    
    // Verify grammar errors are displayed
    cy.get('.grammar-error').should('exist')
    
    // Verify no invalid offset errors
    cy.get('@consoleError').should((spy) => {
      const invalidOffsetErrors = spy.getCalls().filter(
        call => call.args.some(arg => 
          typeof arg === 'string' && arg.includes('Invalid offset')
        )
      )
      expect(invalidOffsetErrors.length).to.equal(0)
    })
  })
  
  it('should correctly handle error positions at edge cases', () => {
    // Start with clean console
    cy.window().then((win) => {
      cy.spy(win.console, 'error').as('consoleError')
    })
    
    // Special case testing with errors at the beginning and end
    const edgeCaseContent = `speling error at start and at the end speling`
    
    cy.get('[data-testid="markdown-input"]')
      .clear()
      .type(edgeCaseContent)
    
    // Wait for grammar check
    cy.wait('@grammarCheck', { timeout: 10000 })
    
    // Verify grammar errors are displayed
    cy.get('.grammar-error').should('exist')
    
    // Verify no invalid offset errors
    cy.get('@consoleError').should((spy) => {
      const invalidOffsetErrors = spy.getCalls().filter(
        call => call.args.some(arg => 
          typeof arg === 'string' && arg.includes('Invalid offset')
        )
      )
      expect(invalidOffsetErrors.length).to.equal(0)
    })
  })
  
  it('should apply error fixes when clicked', () => {
    // Type text with deliberate error
    cy.get('[data-testid="markdown-input"]')
      .clear()
      .type('This is a speling mistake.')
    
    // Wait for grammar check
    cy.wait('@grammarCheck', { timeout: 10000 })
    
    // Find and click on the grammar error
    cy.get('.grammar-error').first().click()
    
    // Grammar error tooltip should appear
    cy.get('[role="tooltip"]').should('exist')
    
    // Click the correction
    cy.contains('spelling').click()
    
    // Verify the correction was applied
    cy.get('[data-testid="markdown-input"]')
      .should('have.value', 'This is a spelling mistake.')
  })
})