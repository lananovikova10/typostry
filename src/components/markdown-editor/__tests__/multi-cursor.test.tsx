import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MarkdownInput } from "../markdown-input"

// jsdom has no layout: computed line-height is "normal", which makes the
// Alt+Click position maths resolve to NaN. Give the textarea a pixel line
// height so click coordinates map to text offsets like in a browser
// (24px padding, 20px lines, 8px chars).
const getTextarea = () => {
  const textarea = screen.getByRole("textbox") as HTMLTextAreaElement
  textarea.style.lineHeight = "20px"
  return textarea
}

const getCursors = (container: HTMLElement) =>
  container.querySelectorAll('[data-testid^="multi-cursor-"]')

describe("Multi-cursor functionality", () => {
  let onChange: jest.Mock

  beforeEach(() => {
    onChange = jest.fn()
  })

  describe("Alt+Click", () => {
    it("should add a cursor on Alt+Click", async () => {
      const { container } = render(
        <MarkdownInput value={"Line 1\nLine 2\nLine 3"} onChange={onChange} />
      )

      const textarea = getTextarea()

      // Simulate Alt+Click (line 2, end of line)
      fireEvent.click(textarea, {
        altKey: true,
        clientX: 100,
        clientY: 50,
      })

      // Check if multi-cursor is active
      await waitFor(() => {
        expect(getCursors(container)).toHaveLength(1)
      })
    })

    it("should add multiple cursors on multiple Alt+Clicks", async () => {
      const { container } = render(
        <MarkdownInput value={"Line 1\nLine 2\nLine 3"} onChange={onChange} />
      )

      const textarea = getTextarea()

      // First Alt+Click
      fireEvent.click(textarea, {
        altKey: true,
        clientX: 100,
        clientY: 50,
      })

      // Second Alt+Click (line 3)
      fireEvent.click(textarea, {
        altKey: true,
        clientX: 100,
        clientY: 70,
      })

      // Check that both secondary cursors are present
      await waitFor(() => {
        expect(getCursors(container)).toHaveLength(2)
      })
    })
  })

  describe("Ctrl+D selection", () => {
    it("should select word at cursor on Ctrl+D when nothing is selected", async () => {
      render(<MarkdownInput value="hello world hello" onChange={onChange} />)

      const textarea = getTextarea()

      // Place cursor at 'h' in first 'hello'
      textarea.setSelectionRange(0, 0)
      textarea.focus()

      // Press Ctrl+D
      fireEvent.keyDown(textarea, { key: "d", ctrlKey: true })

      await waitFor(() => {
        expect(textarea.selectionStart).toBe(0)
        expect(textarea.selectionEnd).toBe(5) // 'hello' selected
      })
    })

    it("should select next occurrence on subsequent Ctrl+D", async () => {
      const { container } = render(
        <MarkdownInput value="hello world hello test hello" onChange={onChange} />
      )

      const textarea = getTextarea()

      // Select first 'hello'
      textarea.setSelectionRange(0, 5)
      textarea.focus()

      // Press Ctrl+D to select next occurrence
      fireEvent.keyDown(textarea, { key: "d", ctrlKey: true })

      // Should have added a cursor at the second 'hello'
      await waitFor(() => {
        const cursors = container.querySelectorAll('[data-testid^="multi-cursor-"]')
        expect(cursors.length).toBeGreaterThan(0)
      })
    })
  })

  describe("Simultaneous typing", () => {
    it("should type at all cursor positions simultaneously", async () => {
      render(<MarkdownInput value={"Line 1\nLine 2\nLine 3"} onChange={onChange} />)

      const textarea = getTextarea()

      // Add cursor with Alt+Click
      fireEvent.click(textarea, {
        altKey: true,
        clientX: 100,
        clientY: 50,
      })

      // Type a character
      fireEvent.keyDown(textarea, { key: "x" })

      // Primary cursor at 0 plus the Alt+Click cursor at the end of line 2
      await waitFor(() => {
        expect(onChange).toHaveBeenLastCalledWith("xLine 1\nLine 2x\nLine 3")
      })
    })

    it("should handle backspace at all cursor positions", async () => {
      render(<MarkdownInput value={"abc\ndef\nghi"} onChange={onChange} />)

      const textarea = getTextarea()

      // Add cursor with Alt+Click
      fireEvent.click(textarea, {
        altKey: true,
        clientX: 50,
        clientY: 50,
      })

      // Press backspace: the caret at 0 deletes nothing, the one after "def" deletes "f"
      fireEvent.keyDown(textarea, { key: "Backspace" })

      await waitFor(() => {
        expect(onChange).toHaveBeenLastCalledWith("abc\nde\nghi")
      })
    })

    it("should handle Enter key at all cursor positions", async () => {
      render(<MarkdownInput value={"Line 1\nLine 2"} onChange={onChange} />)

      const textarea = getTextarea()

      // Add cursor with Alt+Click
      fireEvent.click(textarea, {
        altKey: true,
        clientX: 50,
        clientY: 50,
      })

      // Press Enter
      fireEvent.keyDown(textarea, { key: "Enter" })

      // Newlines inserted at the primary cursor (0) and after "Lin" on line 2
      await waitFor(() => {
        expect(onChange).toHaveBeenLastCalledWith("\nLine 1\nLin\ne 2")
      })
    })
  })

  describe("Escape key", () => {
    it("should exit multi-cursor mode on Escape", async () => {
      const { container } = render(
        <MarkdownInput value={"Line 1\nLine 2\nLine 3"} onChange={onChange} />
      )

      const textarea = getTextarea()

      // Add cursor with Alt+Click
      fireEvent.click(textarea, {
        altKey: true,
        clientX: 100,
        clientY: 50,
      })

      // Verify cursor was added
      await waitFor(() => {
        expect(getCursors(container)).toHaveLength(1)
      })

      // Press Escape
      fireEvent.keyDown(textarea, { key: "Escape" })

      // Cursors should be cleared
      await waitFor(() => {
        expect(getCursors(container)).toHaveLength(0)
      })
    })
  })

  describe("Visual indicators", () => {
    it("should render cursor indicators with correct styling", async () => {
      const { container } = render(
        <MarkdownInput value={"Line 1\nLine 2\nLine 3"} onChange={onChange} />
      )

      const textarea = getTextarea()

      // Add cursor with Alt+Click
      fireEvent.click(textarea, {
        altKey: true,
        clientX: 100,
        clientY: 50,
      })

      await waitFor(() => {
        const cursor = container.querySelector('[data-testid^="multi-cursor-"]')
        expect(cursor).toBeInTheDocument()
        expect(cursor).toHaveClass("bg-blue-500")
        expect(cursor).toHaveClass("animate-pulse")
      })
    })
  })

  describe("Edge cases", () => {
    it("should handle empty text", () => {
      render(<MarkdownInput value="" onChange={onChange} />)

      const textarea = getTextarea()

      // Try Alt+Click on empty text
      fireEvent.click(textarea, {
        altKey: true,
        clientX: 50,
        clientY: 50,
      })

      // Should not crash
      expect(textarea).toBeInTheDocument()
    })

    it("should handle single character text", () => {
      render(<MarkdownInput value="a" onChange={onChange} />)

      const textarea = getTextarea()

      // Place cursor at the character
      textarea.setSelectionRange(0, 0)
      textarea.focus()

      // Press Ctrl+D
      fireEvent.keyDown(textarea, { key: "d", ctrlKey: true })

      // Should select the character
      expect(textarea.selectionStart).toBe(0)
      expect(textarea.selectionEnd).toBe(1)
    })

    it("should not interfere with regular typing when multi-cursor is not active", async () => {
      render(<MarkdownInput value="test" onChange={onChange} />)

      const textarea = getTextarea()
      textarea.focus()

      // Type normally without Alt+Click
      await userEvent.type(textarea, "x")

      // Should call onChange with new text
      expect(onChange).toHaveBeenCalled()
    })
  })
})
