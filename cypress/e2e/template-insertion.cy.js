describe('Template Insertion', () => {
  beforeEach(() => {
    // Visit the app
    cy.visit('/')
    
    // Mock GitLab API response for templates
    cy.intercept('GET', 'https://gitlab.com/api/v4/projects/tgdp%2Ftemplates/repository/tree?ref=v1.3.0&recursive=true', { 
      fixture: 'gitlab-templates.json' 
    }).as('getTemplates')
  })

  it('should open template modal and display available templates', () => {
    // Open the template modal
    cy.get('button[aria-label="Insert template"]').click()
    
    // Wait for API call to complete
    cy.wait('@getTemplates')
    
    // Verify template names are displayed
    cy.get('[role="listbox"]').within(() => {
      cy.contains('Api Reference').should('be.visible')
      cy.contains('How To').should('be.visible')
      cy.contains('Tutorial').should('be.visible')
    })
    
    // Close the modal
    cy.get('button').contains('Cancel').click()
  })

  it('should handle empty template list gracefully', () => {
    // Mock empty response
    cy.intercept('GET', 'https://gitlab.com/api/v4/projects/tgdp%2Ftemplates/repository/tree?ref=v1.3.0&recursive=true', { 
      body: [] 
    }).as('getEmptyTemplates')
    
    // Open the template modal
    cy.get('button[aria-label="Insert template"]').click()
    
    // Wait for API call to complete
    cy.wait('@getEmptyTemplates')
    
    // Verify empty state message
    cy.contains('No templates available').should('be.visible')
    
    // Close the modal
    cy.get('button').contains('Cancel').click()
  })

  it('should handle API errors gracefully', () => {
    // Mock error response
    cy.intercept('GET', 'https://gitlab.com/api/v4/projects/tgdp%2Ftemplates/repository/tree?ref=v1.3.0&recursive=true', {
      statusCode: 500,
      body: { message: 'Internal Server Error' }
    }).as('getErrorTemplates')
    
    // Open the template modal
    cy.get('button[aria-label="Insert template"]').click()
    
    // Wait for API call to complete
    cy.wait('@getErrorTemplates')
    
    // Verify error message
    cy.contains('Failed to fetch templates').should('be.visible')
    cy.contains('Try again').should('be.visible')
    
    // Close the modal
    cy.get('button').contains('Cancel').click()
  })

  it('should filter templates based on search query', () => {
    // Open the template modal
    cy.get('button[aria-label="Insert template"]').click()
    
    // Wait for API call to complete
    cy.wait('@getTemplates')
    
    // Search for specific template
    cy.get('input[aria-label="Search templates"]').type('api')
    
    // Verify filtered results
    cy.get('[role="listbox"]').within(() => {
      cy.contains('Api Reference').should('be.visible')
      cy.contains('How To').should('not.exist')
      cy.contains('Tutorial').should('not.exist')
    })
    
    // Close the modal
    cy.get('button').contains('Cancel').click()
  })

  it('should preview and insert template content', () => {
    // Mock template content fetch
    cy.intercept('GET', 'https://gitlab.com/api/v4/projects/tgdp%2Ftemplates/repository/files/api-reference%2Ftemplate_api-reference.md/raw?ref=v1.3.0', {
      body: '# API Reference\n\nThis is a template for API documentation.'
    }).as('getTemplateContent')
    
    // Open the template modal
    cy.get('button[aria-label="Insert template"]').click()
    
    // Wait for templates to load
    cy.wait('@getTemplates')
    
    // Click on a template
    cy.get('[role="listbox"]').within(() => {
      cy.contains('Api Reference').click()
    })
    
    // Wait for content to load
    cy.wait('@getTemplateContent')
    
    // Verify preview is shown
    cy.contains('# API Reference').should('be.visible')
    
    // Insert the template
    cy.get('button').contains('Insert Template').click()
    
    // Verify content is inserted into editor
    cy.get('textarea[data-testid="markdown-input"]').should('contain.value', '# API Reference')
  })
})