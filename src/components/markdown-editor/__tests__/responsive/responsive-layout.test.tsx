import React from "react"
import { render, screen } from "@testing-library/react"

import { MarkdownEditor } from "../../index"

// Mock the markdown-preview component
jest.mock("../../markdown-preview", () => ({
  MarkdownPreview: ({ source }: { source: string }) => (
    <div data-testid="markdown-preview">{source}</div>
  ),
}))

// Mock window.matchMedia for testing responsive layouts
function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

describe("MarkdownEditor Responsive Layout", () => {
  // Helper function to setup and get required elements
  const setupTest = () => {
    render(<MarkdownEditor initialValue="# Test Content" />)
    const editorContainer = screen.getByTestId("markdown-editor")
    const inputElement = screen.getByTestId("markdown-input")

    return {
      editorContainer,
      inputElement,
    }
  }

  test("editor should keep a minimum height on small screens", () => {
    // Mock small screen (mobile)
    mockMatchMedia(false) // Not matching medium breakpoint

    const { inputElement } = setupTest()

    // The fixed min-height was replaced by an auto-growing textarea that
    // always shows at least 3 rows
    expect(inputElement).toHaveClass("h-auto")
    expect(inputElement).toHaveAttribute("rows", "3")

    // The input fills the available space in the column layout
    const inputRoot = inputElement.parentElement?.parentElement
    expect(inputRoot).toHaveClass("flex-1")
  })

  test("layout should be column (vertical) on small screens", () => {
    // Mock small screen (mobile)
    mockMatchMedia(false) // Not matching medium breakpoint

    const { editorContainer } = setupTest()

    // For small screens, we expect flex-col without flex-row
    const containerDiv = editorContainer.querySelector(".relative.flex.flex-1")
    expect(containerDiv).toHaveClass("flex-col")
    expect(containerDiv).not.toHaveClass("flex-row")
  })

  test("layout should be row (horizontal) on large screens", () => {
    // Mock large screen
    mockMatchMedia(true) // Matching medium breakpoint

    const { editorContainer } = setupTest()

    // Verify editor container has sm:flex-row class
    const containerDiv = editorContainer.querySelector(".relative.flex.flex-1")
    expect(containerDiv).toHaveClass("sm:flex-row")
  })

  test("responsive layout should use correct breakpoints", () => {
    // Mock small screen (mobile)
    mockMatchMedia(false)

    // Render the component
    render(<MarkdownEditor initialValue="# Test Content" />)

    // Get the main container that should have flex-col and sm:flex-row classes
    const editorContainer = screen.getByTestId("markdown-editor")
    const layoutContainer = editorContainer.querySelector(
      ".relative.flex.flex-1"
    )

    // Check that it has flex-col for mobile
    expect(layoutContainer).toHaveClass("flex-col")

    // Check that it has sm:flex-row class for the breakpoint
    expect(layoutContainer?.className).toContain("sm:flex-row")
  })
})
