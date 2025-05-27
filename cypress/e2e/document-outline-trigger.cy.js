/// <reference types="cypress" />

describe('Document Outline Trigger', () => {
  beforeEach(() => {
    // Visit the application's home page
    cy.visit('/')

    // Wait for the editor to load
    cy.get('[data-testid="markdown-editor"]').should('be.visible')
  })

  it('should display the document outline trigger in the viewport', () => {
    // Check the outline trigger is visible
    cy.get('[data-testid="outline-trigger"]')
      .should('be.visible')
      .should('have.attr', 'aria-label', 'Show document outline')
      
    // Check that the trigger has the correct fixed positioning
    cy.get('[data-testid="outline-trigger"]')
      .should('have.css', 'position', 'fixed')
      .should('have.css', 'z-index', '1000')
  })

  it('should show tooltip on hover', () => {
    // Hover over the trigger
    cy.get('[data-testid="outline-trigger"]').trigger('mouseover')
    
    // Check tooltip appears
    cy.contains('Show document outline').should('be.visible')
  })

  it('should open the document outline sidebar when clicked', () => {
    // Initially the sidebar should be collapsed
    cy.get('[data-testid="markdown-sidebar"]').should('not.exist')
    
    // Click the trigger to open the sidebar
    cy.get('[data-testid="outline-trigger"]').click()
    
    // Check the sidebar is visible
    cy.get('[data-testid="markdown-sidebar"]').should('be.visible')
    cy.contains('Document Outline').should('be.visible')
  })

  it('should be accessible via keyboard navigation', () => {
    // Focus on the outline trigger using tabbing simulation
    cy.get('[data-testid="outline-trigger"]').focus()
    
    // Press Enter to activate
    cy.focused().type('{enter}')
    
    // Check the sidebar is visible
    cy.get('[data-testid="markdown-sidebar"]').should('be.visible')
  })

  it('should be visible in both light and dark themes', () => {
    // Check in light theme
    cy.get('[data-testid="outline-trigger"]').should('be.visible')
    
    // Switch to dark theme
    cy.get('button[aria-label="Toggle theme"]').click()
    
    // Check in dark theme
    cy.get('[data-testid="outline-trigger"]').should('be.visible')
  })
})