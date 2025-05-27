describe('Theme Toggle', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display theme toggle icon fully centered in the panel', () => {
    // Get the theme toggle button
    cy.get('button[aria-label="Toggle theme"]').as('themeToggle')
    
    // Check that the button is visible
    cy.get('@themeToggle').should('be.visible')
    
    // The button should have proper flex alignment classes
    cy.get('@themeToggle').should('have.class', 'flex')
    cy.get('@themeToggle').should('have.class', 'items-center')
    cy.get('@themeToggle').should('have.class', 'justify-center')
    
    // Check that the button has the correct size (from the button component)
    cy.get('@themeToggle')
      .invoke('outerWidth')
      .should('be.greaterThan', 0)
      
    cy.get('@themeToggle')
      .invoke('outerHeight')
      .should('be.greaterThan', 0)

    // Verify there's no clipping by checking if all elements are properly aligned
    cy.get('@themeToggle').within(() => {
      // Check that theme icons are in the viewport
      cy.get('svg').should('be.visible')
    })
  })

  it('should toggle between themes correctly when clicked', () => {
    // Get the theme toggle button
    cy.get('button[aria-label="Toggle theme"]').as('themeToggle')
    
    // Open the theme dropdown
    cy.get('@themeToggle').click()
    
    // Dropdown menu should be visible
    cy.get('[role="menu"]').should('be.visible')
    
    // Click on dark theme option
    cy.contains('[role="menuitem"]', 'Dark').click()
    
    // Check that the HTML element has the dark theme class
    cy.get('html').should('have.class', 'dark')
    
    // Open the dropdown again
    cy.get('@themeToggle').click()
    
    // Click on light theme option
    cy.contains('[role="menuitem"]', 'Light').click()
    
    // Check that the HTML element doesn't have the dark theme class
    cy.get('html').should('not.have.class', 'dark')
  })

  it('should maintain icon visibility across different viewport sizes', () => {
    const viewports = [
      { width: 320, height: 568 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1024, height: 768 }, // Desktop
    ]
    
    viewports.forEach(viewport => {
      cy.viewport(viewport.width, viewport.height)
      cy.wait(200) // Allow layout to adjust
      
      // Get the theme toggle button
      cy.get('button[aria-label="Toggle theme"]').as('themeToggle')
      
      // Check that the button is visible
      cy.get('@themeToggle').should('be.visible')
      
      // Verify there's no clipping by checking if all elements are properly aligned
      cy.get('@themeToggle').within(() => {
        // Check that theme icons are in the viewport
        cy.get('svg').should('be.visible')
      })
    })
  })
})