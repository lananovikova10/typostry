import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { MarkdownInput } from "../markdown-input"

describe("MarkdownInput", () => {
  it("renders a textarea with the provided value", () => {
    const value = "Test content"
    render(<MarkdownInput value={value} onChange={() => {}} />)

    const textarea = screen.getByTestId("markdown-input")
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveValue(value)
  })

  it("calls onChange when text is entered", async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()

    render(<MarkdownInput value="" onChange={handleChange} />)

    const textarea = screen.getByTestId("markdown-input")

    // Type each character individually and check that onChange is called
    for (const char of "New text") {
      await user.type(textarea, char)
    }

    expect(handleChange).toHaveBeenCalled()
    // With userEvent, each character triggers onChange separately
    // So we can verify the handler is called with correct values
    expect(handleChange).toHaveBeenCalledTimes("New text".length)
  })

  it("applies the provided className", () => {
    const testClass = "test-class"
    render(<MarkdownInput value="" onChange={() => {}} className={testClass} />)

    const container = screen.getByTestId("markdown-input").parentElement
    expect(container).toHaveClass(testClass)
  })

  it("has the correct accessibility attributes", () => {
    render(<MarkdownInput value="" onChange={() => {}} />)

    const textarea = screen.getByTestId("markdown-input")
    expect(textarea).toHaveAttribute("aria-label", "Markdown editor")
    expect(textarea).toHaveAttribute("spellCheck", "false")
  })

  it("has a placeholder text", () => {
    render(<MarkdownInput value="" onChange={() => {}} />)

    const textarea = screen.getByTestId("markdown-input")
    expect(textarea).toHaveAttribute(
      "placeholder",
      "Write your markdown here..."
    )
  })
})
