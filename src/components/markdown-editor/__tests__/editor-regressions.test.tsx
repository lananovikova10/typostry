import React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"

import { MarkdownEditor } from "../index"

// Network-backed modules are not needed for these tests
jest.mock("@/lib/unsplash", () => ({ getRandomPhotoAsMarkdown: jest.fn() }))
jest.mock("@/lib/huggingface", () => ({ summarizeText: jest.fn() }))

beforeAll(() => {
  if (!("IntersectionObserver" in window)) {
    class IntersectionObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    Object.defineProperty(window, "IntersectionObserver", {
      writable: true,
      value: IntersectionObserverMock,
    })
  }
})

describe("MarkdownEditor regressions", () => {
  const getTextarea = () =>
    screen.getByTestId("markdown-input") as HTMLTextAreaElement

  it("asks for confirmation before New discards unsaved changes", () => {
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(false)
    render(<MarkdownEditor initialValue="" />)

    fireEvent.change(getTextarea(), { target: { value: "unsaved work" } })
    fireEvent.click(screen.getByTestId("file-new"))

    expect(confirmSpy).toHaveBeenCalled()
    expect(getTextarea().value).toBe("unsaved work")
    confirmSpy.mockRestore()
  })

  it("inserts a code block with Ctrl+Shift+C (key reported as 'C')", () => {
    render(<MarkdownEditor initialValue="" />)
    const textarea = getTextarea()
    textarea.focus()

    fireEvent.keyDown(window, { key: "C", ctrlKey: true, shiftKey: true })

    expect(textarea.value).toContain("```")
  })

  it("does not toggle preview when a popup already handled Escape", () => {
    render(<MarkdownEditor initialValue="text" />)

    const handled = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    })
    handled.preventDefault()
    act(() => {
      window.dispatchEvent(handled)
    })
    expect(screen.getByTestId("markdown-input")).toBeInTheDocument()

    fireEvent.keyDown(window, { key: "Escape" })
    expect(screen.queryByTestId("markdown-input")).not.toBeInTheDocument()
  })
})
