/// <reference types="cypress" />

describe('Mermaid Diagram Rendering', () => {
  beforeEach(() => {
    cy.visit('/')
    
    // Clear the editor content
    cy.get('[data-testid="markdown-input"]').clear()
  })

  it('should render flowchart diagrams correctly', () => {
    // Type a mermaid flowchart
    const mermaidCode = 
`\`\`\`mermaid
graph LR
A[Square Rect] -- Link text --> B((Circle))
A --> C(Round Rect)
B --> D{Rhombus}
C --> D
\`\`\``;

    // Type the markdown with mermaid code block
    cy.get('[data-testid="markdown-input"]')
      .type(mermaidCode, { delay: 0 })
    
    // Toggle preview mode
    cy.get('[data-testid="toggle-preview"]').click()
    
    // Verify that the preview container is visible
    cy.get('[data-testid="markdown-preview"]').should('be.visible')
    
    // Check that the code block is not visible as text
    cy.get('[data-testid="markdown-preview"] pre code.language-mermaid')
      .should('not.exist')
    
    // Check that an SVG element is rendered instead
    cy.get('[data-testid="markdown-preview"] svg')
      .should('exist')
      .and('be.visible')
    
    // Check for specific SVG elements that indicate the diagram was rendered
    // For example, check for nodes and edges
    cy.get('[data-testid="markdown-preview"] svg g')
      .should('exist')
  })

  it('should render sequence diagrams correctly', () => {
    // Type a mermaid sequence diagram
    const sequenceDiagram = 
`\`\`\`mermaid
sequenceDiagram
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
    Alice-)John: See you later!
\`\`\``;

    // Type the markdown with mermaid sequence diagram
    cy.get('[data-testid="markdown-input"]')
      .type(sequenceDiagram, { delay: 0 })
    
    // Toggle preview mode
    cy.get('[data-testid="toggle-preview"]').click()
    
    // Verify diagram renders as SVG, not code
    cy.get('[data-testid="markdown-preview"] svg')
      .should('exist')
      .and('be.visible')
    
    // Verify specific sequence diagram elements
    cy.get('[data-testid="markdown-preview"] svg g')
      .should('exist')
  })

  it('should render class diagrams correctly', () => {
    // Type a mermaid class diagram
    const classDiagram = 
`\`\`\`mermaid
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : +int age
    Animal : +String gender
    Animal: +isMammal()
    Animal: +mate()
    class Duck{
      +String beakColor
      +swim()
      +quack()
    }
\`\`\``;

    // Type the markdown with mermaid class diagram
    cy.get('[data-testid="markdown-input"]')
      .type(classDiagram, { delay: 0 })
    
    // Toggle preview mode
    cy.get('[data-testid="toggle-preview"]').click()
    
    // Verify diagram renders as SVG, not code
    cy.get('[data-testid="markdown-preview"] svg')
      .should('exist')
      .and('be.visible')
  })
  
  it('should allow toggling back to edit mode after viewing a diagram', () => {
    // Type a simple mermaid diagram
    const simpleDiagram = 
`\`\`\`mermaid
graph TD
A --> B
\`\`\``;

    // Type the diagram and switch to preview
    cy.get('[data-testid="markdown-input"]')
      .type(simpleDiagram, { delay: 0 })
    cy.get('[data-testid="toggle-preview"]').click()
    
    // Verify diagram appears
    cy.get('[data-testid="markdown-preview"] svg').should('exist')
    
    // Toggle back to edit mode
    cy.get('[data-testid="toggle-preview"]').click()
    
    // Verify we're back in edit mode with the original content
    cy.get('[data-testid="markdown-input"]')
      .should('be.visible')
      .should('have.value', simpleDiagram)
  })
})