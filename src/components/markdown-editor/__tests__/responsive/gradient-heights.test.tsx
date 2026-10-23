import React from "react"
import { render, screen } from "@testing-library/react"

import { MarkdownEditor } from "../../index"

// Mock the markdown-preview component
jest.mock("../../markdown-preview", () => ({
  MarkdownPreview: ({ source }: { source: string }) => (
    <div data-testid="markdown-preview">{source}</div>
  ),
}))

describe("MarkdownEditor Gradient Heights", () => {
  test("gradient background is applied to the textarea wrapper", () => {
    render(<MarkdownEditor initialValue="# Test Content" />)

    const textarea = screen.getByTestId("markdown-input")
    const wrapper = textarea.parentElement

    // The gradient lives on the wrapper so the ghost-text overlay can share it;
    // the textarea itself is transparent on top of it
    expect(wrapper).toHaveClass(
      "bg-gradient-to-br",
      "from-[hsl(var(--editor-gradient-start))]",
      "to-[hsl(var(--editor-gradient-end))]"
    )
    expect(textarea).toHaveClass("bg-transparent")
    expect(textarea).not.toHaveClass("bg-gradient-to-br")
  })
})
