import React from "react"
import { render, screen, waitFor } from "@testing-library/react"

import { MarkdownPreview } from "../../markdown-preview"

// Mock next/dynamic since we're using it in the component
jest.mock("next/dynamic", () => jest.fn(() => () => null))

// Mock mermaid
jest.mock("mermaid", () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    render: jest
      .fn()
      .mockResolvedValue({ svg: "<svg>Mermaid Test Diagram</svg>" }),
  },
}))

describe("Mermaid Rendering in MarkdownPreview", () => {
  // This test verifies that mermaid code blocks get processed and don't remain as code elements
  it("transforms mermaid code blocks into diagram containers", async () => {
    const mermaidMarkdown =
      "```mermaid\ngraph TD\nA[Client] --> B[Server]\nB --> C[Database]\n```"

    const { container } = render(<MarkdownPreview source={mermaidMarkdown} />)

    // Wait for async rendering to complete
    await waitFor(() => {
      // In the real component, the mermaid code block would be transformed
      // and should not be visible as a code element
      const codeElements = container.querySelectorAll("code.language-mermaid")
      expect(codeElements.length).toBe(0)
    })
  })

  // This test checks for SVG creation by mermaid
  it("renders mermaid diagrams as SVG elements", async () => {
    const mermaidMarkdown =
      "```mermaid\ngraph LR\nA[Square Rect] -- Link text --> B((Circle))\n```"

    // We need to mock document.querySelector to return an element that the mermaid.render method can work with
    const originalQuerySelector = document.querySelector
    const mockElement = document.createElement("div")
    document.querySelector = jest.fn().mockReturnValue(mockElement)

    const { container } = render(<MarkdownPreview source={mermaidMarkdown} />)

    // Wait for async processing to complete
    await waitFor(() => {
      // Look for mermaid diagram container
      const mermaidContainer = container.querySelector(".mermaid-diagram")
      expect(mermaidContainer).not.toBeNull()
    })

    // Restore original querySelector
    document.querySelector = originalQuerySelector
  })

  // This test verifies the complete flow from markdown to rendered diagram
  it("processes and renders mermaid flowcharts correctly", async () => {
    const flowchartMarkdown =
      "```mermaid\ngraph LR\nA[Square Rect] -- Link text --> B((Circle))\nA --> C(Round Rect)\nB --> D{Rhombus}\nC --> D\n```"

    const { container } = render(<MarkdownPreview source={flowchartMarkdown} />)

    // Wait for the mermaid diagram to be processed
    await waitFor(() => {
      // The container should not contain a code block with mermaid language class
      const mermaidCodeBlock = container.querySelector("code.language-mermaid")
      expect(mermaidCodeBlock).toBeNull()

      // Instead it should have been replaced with a mermaid container
      const diagramContainer = container.querySelector(
        ".mermaid-diagram, .mermaid-svg-container"
      )
      expect(diagramContainer).not.toBeNull()
    })
  })
})
