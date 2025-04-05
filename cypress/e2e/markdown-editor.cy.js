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
})