// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

import '@testing-library/cypress/add-commands'

// Custom command for tabbing
Cypress.Commands.add('tab', { prevSubject: 'optional' }, (subject) => {
  const options = {
    altKey: false,
    ctrlKey: false,
    shiftKey: false,
    metaKey: false
  }
  
  const eventData = {
    which: 9,
    keyCode: 9,
    key: 'Tab',
    code: 'Tab',
    ...options
  }
  
  if (subject) {
    cy.wrap(subject).trigger('keydown', eventData)
  } else {
    cy.focused().trigger('keydown', eventData)
  }
  
  return cy.document().trigger('keyup', eventData)
})