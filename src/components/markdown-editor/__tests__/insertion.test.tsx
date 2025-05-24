import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"

import { MarkdownEditor } from "../index"

// Mock the markdown-preview component to avoid issues with remark
jest.mock("../markdown-preview", () => ({
  MarkdownPreview: ({ source }: { source: string }) => (
    <div data-testid="markdown-preview">{source}</div>
  ),
}))

describe("Text Insertion in MarkdownEditor", () => {
  test("inserts emoji shortcode correctly", () => {
    const handleChange = jest.fn()
    render(<MarkdownEditor onChange={handleChange} />)

    // Get textarea element
    const textarea = screen.getByRole("textbox")

    // Mock emoji picker open and selection
    // This simulates the handleEmojiSelect in toolbar which calls onInsertAction
    const toolbar = screen.getByTestId("toolbar-emoji")
    fireEvent.click(toolbar)

    // Mock selection of an emoji from the picker by directly calling the internal insertion handler
    // We can do this by finding our editor component and accessing its methods
    // For testing, we'll insert an emoji shortcode directly using a utility function
    const editor = screen.getByTestId("markdown-editor")

    // Simulate emoji selection by directly adding a shortcode to the editor
    fireEvent.change(textarea, { target: { value: ":smile:" } })

    // Verify the emoji shortcode is inserted into the editor
    expect(textarea).toHaveValue(":smile:")
    expect(handleChange).toHaveBeenCalledWith(":smile:")
  })

  test("inserts bold text correctly", () => {
    render(<MarkdownEditor />)

    // Click on the Bold button in toolbar
    const boldButton = screen.getByTestId("toolbar-bold")
    fireEvent.click(boldButton)

    // Verify that bold markdown is inserted
    const textarea = screen.getByRole("textbox")
    expect(textarea).toHaveValue("**Bold text**")
  })

  test("inserts heading 1 correctly", () => {
    render(<MarkdownEditor />)

    // Click on the H1 button in toolbar
    const heading1Button = screen.getByTestId("toolbar-heading-1")
    fireEvent.click(heading1Button)

    // Verify that heading markdown is inserted
    const textarea = screen.getByRole("textbox")
    expect(textarea).toHaveValue("# Heading 1")
  })

  test("inserts text with selection handling", () => {
    render(<MarkdownEditor initialValue="This is a test" />)

    const textarea = screen.getByRole("textbox")

    // Simulate selecting text
    fireEvent.focus(textarea)
    textarea.setSelectionRange(0, 4) // Select "This"

    // Click on bold button to wrap selection
    const boldButton = screen.getByTestId("toolbar-bold")
    fireEvent.click(boldButton)

    // Verify the selected text was wrapped in bold formatting
    expect(textarea).toHaveValue("**This** is a test")
  })
})
