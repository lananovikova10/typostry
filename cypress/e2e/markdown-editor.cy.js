/// <reference types="cypress" />

describe('Markdown Editor', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should render the markdown editor', () => {
    cy.get('[data-testid="markdown-input"]').should('exist')
    cy.get('[data-testid="toggle-preview"]').should('exist')
  })

  it('should show initial content', () => {
    cy.get('[data-testid="markdown-input"]').should('contain.value', 'Hello World')
  })

  it('should update the markdown content when typing', () => {
    cy.get('[data-testid="markdown-input"]')
      .clear()
      .type('# New Heading')
      .should('have.value', '# New Heading')
  })

  it('should toggle between edit and preview modes', () => {
    // Verify edit mode is active
    cy.get('[data-testid="markdown-input"]').should('be.visible')
    
    // Toggle to preview mode
    cy.get('[data-testid="toggle-preview"]').click()
    
    // Verify preview mode is active
    cy.get('[data-testid="markdown-preview"]').should('be.visible')
    cy.get('[data-testid="markdown-input"]').should('not.exist')
    
    // Verify content is rendered correctly
    cy.get('[data-testid="markdown-preview"] h1').should('contain', 'Hello World')
    
    // Toggle back to edit mode
    cy.get('[data-testid="toggle-preview"]').click()
    
    // Verify edit mode is active again
    cy.get('[data-testid="markdown-input"]').should('be.visible')
  })

  it('should insert markdown when toolbar buttons are clicked', () => {
    cy.get('[data-testid="markdown-input"]').clear()
    
    // Test a few toolbar buttons
    cy.get('[data-testid="toolbar-bold"]').click()
    cy.get('[data-testid="markdown-input"]').should('have.value', '**Bold text**')
    
    cy.get('[data-testid="markdown-input"]').clear()
    cy.get('[data-testid="toolbar-heading-1"]').click()
    cy.get('[data-testid="markdown-input"]').should('contain.value', '# Heading 1')
  })
  
  it('should insert emoji shortcode when emoji is selected from picker', () => {
    cy.get('[data-testid="markdown-input"]').clear()
    
    // Open the emoji picker
    cy.get('[data-testid="toolbar-emoji"]').click()
    
    // Wait for the emoji picker to appear
    cy.get('[data-slot="emoji-picker"]').should('be.visible')
    
    // Select an emoji (first emoji in the list)
    cy.get('[data-slot="emoji-picker-emoji"]').first().click()
    
    // Verify the emoji shortcode was inserted
    cy.get('[data-testid="markdown-input"]').invoke('val').should('match', /^:[a-z_]+:$/)
    
    // Verify the emoji picker is closed after selection
    cy.get('[data-slot="emoji-picker"]').should('not.exist')
  })

  it('should render markdown correctly in preview mode', () => {
    cy.get('[data-testid="markdown-input"]')
      .clear()
      .type('# Test\n## Subheading\n**Bold** and *italic*\n\n```\ncode block\n```')
    
    cy.get('[data-testid="toggle-preview"]').click()
    
    cy.get('[data-testid="markdown-preview"] h1').should('contain', 'Test')
    cy.get('[data-testid="markdown-preview"] h2').should('contain', 'Subheading')
    cy.get('[data-testid="markdown-preview"] strong').should('contain', 'Bold')
    cy.get('[data-testid="markdown-preview"] em').should('contain', 'italic')
    cy.get('[data-testid="markdown-preview"] pre code').should('contain', 'code block')
  })

  it('should retain content when switching between edit and preview modes', () => {
    const testContent = '# Test Content'
    
    cy.get('[data-testid="markdown-input"]')
      .clear()
      .type(testContent)
    
    // Switch to preview
    cy.get('[data-testid="toggle-preview"]').click()
    
    // Switch back to edit
    cy.get('[data-testid="toggle-preview"]').click()
    
    // Content should be preserved
    cy.get('[data-testid="markdown-input"]').should('have.value', testContent)
  })

  it('should be accessible via keyboard', () => {
    // Tab to the editor
    cy.get('body').tab()
    cy.tab().tab().tab() // Navigate to the editor (adjust tab count as needed)
    
    // Type content
    cy.focused().type('# Keyboard Access Test')
    
    // Tab to the preview button and press it
    cy.tab().tab().tab().tab() // Navigate to preview button
    cy.focused().type('{enter}') // Press Enter to activate button
    
    // Verify preview is shown
    cy.get('[data-testid="markdown-preview"] h1').should('contain', 'Keyboard Access Test')
  })

  it('should display grammar errors with blue wavy underlines', () => {
    // Mock the grammar check API response
    cy.intercept('POST', '**/v2/check', {
      statusCode: 200,
      body: {
        software: {
          name: "LanguageTool",
          version: "5.9",
          apiVersion: 1
        },
        language: {
          name: "English (US)",
          code: "en-US"
        },
        matches: [
          {
            message: "This is a grammar error",
            shortMessage: "Grammar error",
            offset: 10,
            length: 5,
            replacements: [
              { value: "correct" }
            ],
            context: {
              text: "This is a error in grammar",
              offset: 10,
              length: 5
            },
            rule: {
              id: "GRAMMAR_ERROR",
              description: "Grammar rule description",
              issueType: "grammar"
            }
          }
        ]
      }
    }).as('grammarCheck')
    
    // Type text that would trigger a grammar error
    cy.get('[data-testid="markdown-input"]')
      .clear()
      .type('This is a error in grammar')
    
    // Wait for the grammar check API call to complete
    cy.wait('@grammarCheck')
    
    // Find the grammar error marker and verify it has the correct class
    cy.get('.grammar-error-grammar').should('exist')
    
    // Verify the styling is applied correctly
    cy.get('.grammar-error-grammar')
      .should('have.css', 'text-decoration-style', 'wavy')
      .should('have.css', 'text-decoration-color', 'rgb(49, 130, 206)')  // #3182ce in RGB
  })

  it('should display spelling errors with red wavy underlines', () => {
    // Mock the grammar check API response for spelling errors
    cy.intercept('POST', '**/v2/check', {
      statusCode: 200,
      body: {
        software: {
          name: "LanguageTool",
          version: "5.9",
          apiVersion: 1
        },
        language: {
          name: "English (US)",
          code: "en-US"
        },
        matches: [
          {
            message: "Possible spelling mistake found",
            shortMessage: "Spelling mistake",
            offset: 10,
            length: 6,
            replacements: [
              { value: "spelling" }
            ],
            context: {
              text: "This is a speling mistake",
              offset: 10,
              length: 6
            },
            rule: {
              id: "SPELLING_ERROR",
              description: "Spelling rule description",
              issueType: "misspelling"
            }
          }
        ]
      }
    }).as('spellingCheck')
    
    // Type text that would trigger a spelling error
    cy.get('[data-testid="markdown-input"]')
      .clear()
      .type('This is a speling mistake')
    
    // Wait for the grammar check API call to complete
    cy.wait('@spellingCheck')
    
    // Find the spelling error marker and verify it has the correct class
    cy.get('.grammar-error-spelling').should('exist')
    
    // Verify the styling is applied correctly
    cy.get('.grammar-error-spelling')
      .should('have.css', 'text-decoration-style', 'wavy')
      .should('have.css', 'text-decoration-color', 'rgb(245, 101, 101)')  // #f56565 in RGB
  })
})