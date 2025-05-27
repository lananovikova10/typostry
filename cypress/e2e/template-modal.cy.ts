describe('Template Modal', () => {
  beforeEach(() => {
    // @ts-ignore - Cypress global
    cy.visit('/')
    // Open the template modal (implementation depends on how it's opened in your app)
    // This is a placeholder; adjust the selector based on your actual UI
    // @ts-ignore - Cypress global
    cy.get('[data-testid="open-template-modal"]').click()
  })

  it('displays templates when API call succeeds', () => {
    // Intercept the GitLab API request
    // @ts-ignore - Cypress global
    cy.intercept(
      'GET',
      'https://gitlab.com/api/v4/projects/tgdp%2Ftemplates/repository/tree?ref=v1.3.0&recursive=true',
      {
        statusCode: 200,
        body: [
          {
            id: '1',
            name: 'template_api-reference.md',
            type: 'blob',
            path: 'api-reference/template_api-reference.md',
            mode: '100644'
          },
          {
            id: '2',
            name: 'template_how-to.md',
            type: 'blob',
            path: 'how-to/template_how-to.md',
            mode: '100644'
          }
        ]
      }
    ).as('getTemplates')

    // Wait for the API call to complete
    // @ts-ignore - Cypress global
    cy.wait('@getTemplates')

    // Verify templates are displayed
    // @ts-ignore - Cypress global
    cy.get('[data-testid="template-list"]').should('be.visible')
    // @ts-ignore - Cypress global
    cy.contains('Api Reference').should('be.visible')
    // @ts-ignore - Cypress global
    cy.contains('How To').should('be.visible')
  })

  it('displays empty state when no templates are available', () => {
    // Intercept the GitLab API request and return empty array
    // @ts-ignore - Cypress global
    cy.intercept(
      'GET',
      'https://gitlab.com/api/v4/projects/tgdp%2Ftemplates/repository/tree?ref=v1.3.0&recursive=true',
      {
        statusCode: 200,
        body: []
      }
    ).as('getEmptyTemplates')

    // Wait for the API call to complete
    // @ts-ignore - Cypress global
    cy.wait('@getEmptyTemplates')

    // Verify empty state is displayed
    // @ts-ignore - Cypress global
    cy.get('[data-testid="empty-state"]').should('be.visible')
    // @ts-ignore - Cypress global
    cy.contains('No templates available').should('be.visible')
  })

  it('displays error state when API call fails', () => {
    // Intercept the GitLab API request and return an error
    // @ts-ignore - Cypress global
    cy.intercept(
      'GET',
      'https://gitlab.com/api/v4/projects/tgdp%2Ftemplates/repository/tree?ref=v1.3.0&recursive=true',
      {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      }
    ).as('getTemplatesError')

    // Wait for the API call to complete
    // @ts-ignore - Cypress global
    cy.wait('@getTemplatesError')

    // Verify error state is displayed
    // @ts-ignore - Cypress global
    cy.contains('Failed to fetch templates').should('be.visible')
    // @ts-ignore - Cypress global
    cy.contains('Try again').should('be.visible')
  })

  it('fetches and displays template content when template is selected', () => {
    // Intercept the GitLab API requests
    // @ts-ignore - Cypress global
    cy.intercept(
      'GET',
      'https://gitlab.com/api/v4/projects/tgdp%2Ftemplates/repository/tree?ref=v1.3.0&recursive=true',
      {
        statusCode: 200,
        body: [
          {
            id: '1',
            name: 'template_api-reference.md',
            type: 'blob',
            path: 'api-reference/template_api-reference.md',
            mode: '100644'
          }
        ]
      }
    ).as('getTemplates')

    // Intercept the template content request
    // @ts-ignore - Cypress global
    cy.intercept(
      'GET',
      'https://gitlab.com/api/v4/projects/tgdp%2Ftemplates/repository/files/api-reference%2Ftemplate_api-reference.md/raw?ref=v1.3.0',
      {
        statusCode: 200,
        body: '# API Reference Template\n\nThis is a sample template for API documentation.'
      }
    ).as('getTemplateContent')

    // Wait for the templates list to load
    // @ts-ignore - Cypress global
    cy.wait('@getTemplates')

    // Click on the template
    // @ts-ignore - Cypress global
    cy.contains('Api Reference').click()

    // Wait for the template content to load
    // @ts-ignore - Cypress global
    cy.wait('@getTemplateContent')

    // Verify preview content is displayed
    // @ts-ignore - Cypress global
    cy.get('[data-testid="template-preview"]')
      .should('contain', '# API Reference Template')
  })

  it('supports retrying when template fetch fails', () => {
    // First request fails
    // @ts-ignore - Cypress global
    cy.intercept(
      {
        method: 'GET',
        url: 'https://gitlab.com/api/v4/projects/tgdp%2Ftemplates/repository/tree?ref=v1.3.0&recursive=true',
        times: 1
      },
      {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      }
    ).as('getTemplatesError')

    // Second request succeeds
    // @ts-ignore - Cypress global
    cy.intercept(
      {
        method: 'GET',
        url: 'https://gitlab.com/api/v4/projects/tgdp%2Ftemplates/repository/tree?ref=v1.3.0&recursive=true',
        times: 1
      },
      {
        statusCode: 200,
        body: [
          {
            id: '1',
            name: 'template_api-reference.md',
            type: 'blob',
            path: 'api-reference/template_api-reference.md',
            mode: '100644'
          }
        ]
      }
    ).as('getTemplatesRetry')

    // Wait for the first failed request
    // @ts-ignore - Cypress global
    cy.wait('@getTemplatesError')

    // Verify error is displayed
    // @ts-ignore - Cypress global
    cy.contains('Failed to fetch templates').should('be.visible')

    // Click retry
    // @ts-ignore - Cypress global
    cy.contains('Try again').click()

    // Wait for the retry request
    // @ts-ignore - Cypress global
    cy.wait('@getTemplatesRetry')

    // Verify templates are now displayed
    // @ts-ignore - Cypress global
    cy.contains('Api Reference').should('be.visible')
  })
})