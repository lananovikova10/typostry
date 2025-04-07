import { render, screen, fireEvent } from "@testing-library/react"
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

  it("handles image paste events correctly", () => {
    const handleChange = jest.fn()
    render(<MarkdownInput value="" onChange={handleChange} />)

    const textarea = screen.getByTestId("markdown-input")

    // Create a mock clipboard event with image data
    const mockImageDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    const file = new File(["dummy content"], "image.png", { type: "image/png" })

    // Create a mock FileReader that returns our test image data
    const originalFileReader = global.FileReader
    global.FileReader = jest.fn(() => ({
      readAsDataURL: jest.fn(),
      onload: null,
      result: mockImageDataUrl
    }))

    // Create a mock clipboard event
    const clipboardData = {
      items: [
        {
          type: "image/png",
          getAsFile: () => file
        }
      ]
    }

    // Trigger the paste event
    fireEvent.paste(textarea, {
      clipboardData,
      preventDefault: jest.fn()
    })

    // Manually trigger the FileReader onload event
    const reader = global.FileReader.mock.instances[0]
    reader.onload({ target: { result: mockImageDataUrl } })

    // Check that onChange was called with the correct Markdown syntax
    expect(handleChange).toHaveBeenCalledWith(`![](${mockImageDataUrl})`)

    // Restore the original FileReader
    global.FileReader = originalFileReader
  })

  it("handles URL paste events correctly", () => {
    const handleChange = jest.fn()
    render(<MarkdownInput value="" onChange={handleChange} />)

    const textarea = screen.getByTestId("markdown-input")

    // Create a mock clipboard event with URL data
    const mockUrl = "https://example.com"
    const clipboardData = {
      items: [],
      getData: () => mockUrl
    }

    // Set up the textarea with selection properties
    Object.defineProperty(textarea, 'selectionStart', { value: 0 })
    Object.defineProperty(textarea, 'selectionEnd', { value: 0 })

    // Trigger the paste event
    fireEvent.paste(textarea, {
      clipboardData,
      preventDefault: jest.fn(),
      currentTarget: textarea
    })

    // Check that onChange was called with the correct Markdown link syntax
    expect(handleChange).toHaveBeenCalledWith(`[Link](${mockUrl})`)
  })

  it("handles regular text paste events correctly", () => {
    const handleChange = jest.fn()
    const initialValue = "Initial text"
    render(<MarkdownInput value={initialValue} onChange={handleChange} />)

    const textarea = screen.getByTestId("markdown-input")

    // Create a mock clipboard event with regular text data
    const pastedText = "Pasted text"
    const clipboardData = {
      items: [],
      getData: () => pastedText
    }

    // Set up the textarea with selection properties
    // Simulate cursor at position 7 (after "Initial")
    Object.defineProperty(textarea, 'selectionStart', { value: 7 })
    Object.defineProperty(textarea, 'selectionEnd', { value: 7 })

    // Trigger the paste event
    fireEvent.paste(textarea, {
      clipboardData,
      preventDefault: jest.fn(),
      currentTarget: textarea
    })

    // Check that onChange was called with the correct combined text
    expect(handleChange).toHaveBeenCalledWith("Initial Pasted text text")
  })
})
