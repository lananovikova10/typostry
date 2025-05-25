/// <reference types="cypress" />

describe('Table Generator', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should insert a table when the table button is clicked and a size is selected', () => {
    // Clear the editor first
    cy.get('[data-testid="markdown-input"]').clear()
    
    // Click the table button
    cy.get('[data-testid="toolbar-table"]').click()
    
    // Verify the table grid popover appears
    cy.get('[data-testid="table-grid-popover"]').should('be.visible')
    cy.contains('Max size: 10 rows × 8 columns').should('exist')
    
    // Select a 3×4 table size (third row, fourth column)
    cy.get('[aria-label="Select 3×4 table"]').click()
    
    // Verify the popover closes
    cy.get('[data-testid="table-grid-popover"]').should('not.exist')
    
    // Verify the table markdown is inserted correctly
    cy.get('[data-testid="markdown-input"]').should('have.value', [
      '| Header 1 | Header 2 | Header 3 | Header 4 |',
      '|----------|----------|----------|----------|',
      '|          |          |          |          |',
      '|          |          |          |          |',
      '|          |          |          |          |',
      ''
    ].join('\n'))
    
    // Verify that the cursor is positioned in the first header cell
    // by typing and checking if it replaces 'Header 1'
    cy.get('[data-testid="markdown-input"]').type('Column 1')
    cy.get('[data-testid="markdown-input"]').should('have.value', [
      '| Column 1 | Header 2 | Header 3 | Header 4 |',
      '|----------|----------|----------|----------|',
      '|          |          |          |          |',
      '|          |          |          |          |',
      '|          |          |          |          |',
      ''
    ].join('\n'))
  })

  it('should insert table at different cursor positions', () => {
    // Test inserting at beginning
    cy.get('[data-testid="markdown-input"]').clear()
    cy.get('[data-testid="toolbar-table"]').click()
    cy.get('[aria-label="Select 2×2 table"]').click()
    
    // Verify table at beginning
    cy.get('[data-testid="markdown-input"]').should('have.value', [
      '| Header 1 | Header 2 |',
      '|----------|----------|',
      '|          |          |',
      '|          |          |',
      ''
    ].join('\n'))
    
    // Test inserting in middle of paragraph
    cy.get('[data-testid="markdown-input"]').clear()
    cy.get('[data-testid="markdown-input"]').type('Text before table{enter}{enter}')
    cy.get('[data-testid="toolbar-table"]').click()
    cy.get('[aria-label="Select 2×2 table"]').click()
    
    // Verify table in middle
    cy.get('[data-testid="markdown-input"]').should('have.value', [
      'Text before table',
      '',
      '| Header 1 | Header 2 |',
      '|----------|----------|',
      '|          |          |',
      '|          |          |',
      ''
    ].join('\n'))
    
    // Test inserting at end
    cy.get('[data-testid="markdown-input"]').clear()
    cy.get('[data-testid="markdown-input"]')
      .type('Text before table{enter}{enter}More text here{enter}')
    
    // Move cursor to end and insert table
    cy.get('[data-testid="markdown-input"]').type('{end}')
    cy.get('[data-testid="toolbar-table"]').click()
    cy.get('[aria-label="Select 2×2 table"]').click()
    
    // Verify table at end
    cy.get('[data-testid="markdown-input"]').should('have.value', [
      'Text before table',
      '',
      'More text here',
      '| Header 1 | Header 2 |',
      '|----------|----------|',
      '|          |          |',
      '|          |          |',
      ''
    ].join('\n'))
  })
  
  it('should dismiss the table selector when clicking outside or pressing Escape', () => {
    // Open the table selector
    cy.get('[data-testid="toolbar-table"]').click()
    cy.get('[data-testid="table-grid-popover"]').should('be.visible')
    
    // Press Escape key
    cy.get('body').type('{esc}')
    cy.get('[data-testid="table-grid-popover"]').should('not.exist')
    
    // Open the table selector again
    cy.get('[data-testid="toolbar-table"]').click()
    cy.get('[data-testid="table-grid-popover"]').should('be.visible')
    
    // Click outside
    cy.get('[data-testid="markdown-input"]').click()
    cy.get('[data-testid="table-grid-popover"]').should('not.exist')
  })
  
  it('should render the inserted table correctly in preview mode', () => {
    // Insert a table
    cy.get('[data-testid="markdown-input"]').clear()
    cy.get('[data-testid="toolbar-table"]').click()
    cy.get('[aria-label="Select 2×3 table"]').click()
    
    // Switch to preview mode
    cy.get('[data-testid="toggle-preview"]').click()
    
    // Check table is rendered correctly in preview
    cy.get('[data-testid="markdown-preview"] table').should('exist')
    cy.get('[data-testid="markdown-preview"] table thead tr th').should('have.length', 3)
    cy.get('[data-testid="markdown-preview"] table tbody tr').should('have.length', 2)
  })
})