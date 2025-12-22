import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MarkdownInput } from "../markdown-input"

describe("Multi-cursor functionality", () => {
  let onChange: jest.Mock

  beforeEach(() => {
    onChange = jest.fn()
  })

  describe("Alt+Click", () => {
    it("should add a cursor on Alt+Click", async () => {
      const { container } = render(
        <MarkdownInput value="Line 1\nLine 2\nLine 3" onChange={onChange} />
      )

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement

      // Simulate Alt+Click
      fireEvent.click(textarea, {
        altKey: true,
        clientX: 100,
        clientY: 50,
      })

      // Check if multi-cursor is active
      await waitFor(() => {
        const cursors = container.querySelectorAll('[data-testid^="multi-cursor-"]')
        expect(cursors.length).toBeGreaterThan(0)
      })
    })

    it("should add multiple cursors on multiple Alt+Clicks", async () => {
      const { container } = render(
        <MarkdownInput value="Line 1\nLine 2\nLine 3" onChange={onChange} />
      )

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement

      // First Alt+Click
      fireEvent.click(textarea, {
        altKey: true,
        clientX: 100,
        clientY: 50,
      })

      // Second Alt+Click
      fireEvent.click(textarea, {
        altKey: true,
        clientX: 100,
        clientY: 100,
      })

      // Check if multiple cursors are present
      await waitFor(() => {
        const cursors = container.querySelectorAll('[data-testid^="multi-cursor-"]')
        expect(cursors.length).toBeGreaterThan(1)
      })
    })
  })

  describe("Ctrl+D selection", () => {
    it("should select word at cursor on Ctrl+D when nothing is selected", async () => {
      render(<MarkdownInput value="hello world hello" onChange={onChange} />)

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement

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

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement

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
      render(<MarkdownInput value="Line 1\nLine 2\nLine 3" onChange={onChange} />)

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement

      // Add cursor with Alt+Click
      fireEvent.click(textarea, {
        altKey: true,
        clientX: 100,
        clientY: 50,
      })

      // Type a character
      fireEvent.keyDown(textarea, { key: "x" })

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled()
        // Check that text was modified
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
        expect(lastCall).toContain("x")
      })
    })

    it("should handle backspace at all cursor positions", async () => {
      render(<MarkdownInput value="abc\ndef\nghi" onChange={onChange} />)

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement

      // Add cursor with Alt+Click
      fireEvent.click(textarea, {
        altKey: true,
        clientX: 50,
        clientY: 50,
      })

      // Press backspace
      fireEvent.keyDown(textarea, { key: "Backspace" })

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled()
      })
    })

    it("should handle Enter key at all cursor positions", async () => {
      render(<MarkdownInput value="Line 1\nLine 2" onChange={onChange} />)

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement

      // Add cursor with Alt+Click
      fireEvent.click(textarea, {
        altKey: true,
        clientX: 50,
        clientY: 50,
      })

      // Press Enter
      fireEvent.keyDown(textarea, { key: "Enter" })

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled()
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
        // Should have added newlines
        expect((lastCall.match(/\n/g) || []).length).toBeGreaterThan(2)
      })
    })
  })

  describe("Escape key", () => {
    it("should exit multi-cursor mode on Escape", async () => {
      const { container } = render(
        <MarkdownInput value="Line 1\nLine 2\nLine 3" onChange={onChange} />
      )

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement

      // Add cursor with Alt+Click
      fireEvent.click(textarea, {
        altKey: true,
        clientX: 100,
        clientY: 50,
      })

      // Verify cursor was added
      await waitFor(() => {
        const cursors = container.querySelectorAll('[data-testid^="multi-cursor-"]')
        expect(cursors.length).toBeGreaterThan(0)
      })

      // Press Escape
      fireEvent.keyDown(textarea, { key: "Escape" })

      // Cursors should be cleared
      await waitFor(() => {
        const cursors = container.querySelectorAll('[data-testid^="multi-cursor-"]')
        expect(cursors.length).toBe(0)
      })
    })
  })

  describe("Visual indicators", () => {
    it("should render cursor indicators with correct styling", async () => {
      const { container } = render(
        <MarkdownInput value="Line 1\nLine 2\nLine 3" onChange={onChange} />
      )

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement

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

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement

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

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement

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

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement
      textarea.focus()

      // Type normally without Alt+Click
      await userEvent.type(textarea, "x")

      // Should call onChange with new text
      expect(onChange).toHaveBeenCalled()
    })
  })
})
