import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { MarkdownEditor } from "../index"

// Mock the markdown-preview component to avoid issues with remark
jest.mock("../markdown-preview", () => ({
  MarkdownPreview: ({ source }: { source: string }) => (
    <div data-testid="markdown-preview">{source}</div>
  ),
}))

// Mock window.showOpenFilePicker and window.showSaveFilePicker
const setupFilePicker = (
  fileContent = "# Test Content",
  fileName = "test.md"
) => {
  const mockFile = new File([fileContent], fileName, { type: "text/markdown" })
  const mockFileHandle = {
    kind: "file",
    name: fileName,
    getFile: jest.fn().mockResolvedValue(mockFile),
    createWritable: jest.fn().mockResolvedValue({
      write: jest.fn().mockResolvedValue(undefined),
      close: jest.fn().mockResolvedValue(undefined),
    }),
  }

  // Mock the File System Access API
  global.window.showOpenFilePicker = jest
    .fn()
    .mockResolvedValue([mockFileHandle])
  global.window.showSaveFilePicker = jest.fn().mockResolvedValue(mockFileHandle)

  return { mockFile, mockFileHandle }
}

// Mock for window.confirm
window.confirm = jest.fn().mockImplementation(() => true)

describe("MarkdownEditor", () => {
  beforeEach(() => {
    // Reset mocks between tests
    jest.clearAllMocks()

    // Set up File System Access API support detection
    if (!window.showOpenFilePicker) {
      Object.defineProperty(window, "showOpenFilePicker", {
        value: jest.fn(),
        configurable: true,
        writable: true,
      })
    }
    if (!window.showSaveFilePicker) {
      Object.defineProperty(window, "showSaveFilePicker", {
        value: jest.fn(),
        configurable: true,
        writable: true,
      })
    }
  })

  test("renders editor with initial value", () => {
    const initialValue = "# Hello World"
    render(<MarkdownEditor initialValue={initialValue} />)

    // Find the textarea element
    const textarea = screen.getByRole("textbox")
    expect(textarea).toHaveValue(initialValue)
  })

  test("calls onChange when content changes", () => {
    const handleChange = jest.fn()
    render(<MarkdownEditor onChange={handleChange} />)

    const textarea = screen.getByRole("textbox")
    fireEvent.change(textarea, { target: { value: "New content" } })

    expect(handleChange).toHaveBeenCalledWith("New content")
  })

  test("creates a new file", () => {
    const handleChange = jest.fn()
    const initialValue = "Initial content"
    render(
      <MarkdownEditor initialValue={initialValue} onChange={handleChange} />
    )

    // Click the new file button
    const newButton = screen.getByTestId("file-new")
    fireEvent.click(newButton)

    // Check if content was cleared
    const textarea = screen.getByRole("textbox")
    expect(textarea).toHaveValue("")
    expect(handleChange).toHaveBeenCalledWith("")
  })

  test("opens a file using File System Access API", async () => {
    setupFilePicker("# File Content", "test.md")
    const handleChange = jest.fn()

    render(<MarkdownEditor onChange={handleChange} />)

    // Click the open file button
    const openButton = screen.getByTestId("file-open")
    fireEvent.click(openButton)

    // Verify the file picker was called
    await waitFor(() => {
      expect(window.showOpenFilePicker).toHaveBeenCalled()
    })
  })

  test("saves a file using File System Access API", async () => {
    const { mockFileHandle } = setupFilePicker("# Test Content", "test.md")
    const handleChange = jest.fn()

    render(
      <MarkdownEditor initialValue="# Test Content" onChange={handleChange} />
    )

    // First, open a file to get the file handle
    const openButton = screen.getByTestId("file-open")
    fireEvent.click(openButton)

    await waitFor(() => {
      expect(window.showOpenFilePicker).toHaveBeenCalled()
    })

    // Then save the file
    const saveButton = screen.getByTestId("file-save")
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockFileHandle.createWritable).toHaveBeenCalled()
    })
  })

  test("toggles between edit and preview mode", () => {
    render(<MarkdownEditor initialValue="# Hello World" />)

    // Initially in edit mode, textarea should be visible
    expect(screen.getByRole("textbox")).toBeInTheDocument()

    // Click the preview button
    const previewButton = screen.getByTestId("toggle-preview")
    fireEvent.click(previewButton)

    // In preview mode, textarea should not be visible
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()

    // Click again to go back to edit mode
    fireEvent.click(previewButton)

    // Back in edit mode, textarea should be visible again
    expect(screen.getByRole("textbox")).toBeInTheDocument()
  })

  test("shows reading stats in edit mode but not in preview mode", () => {
    render(<MarkdownEditor initialValue="# Hello World" />)

    // In edit mode, reading stats should be visible
    expect(screen.getByRole("status")).toBeInTheDocument()
    expect(screen.getByRole("status").textContent).toContain("Reading Time")

    // Switch to preview mode
    const previewButton = screen.getByTestId("toggle-preview")
    fireEvent.click(previewButton)

    // In preview mode, reading stats should not be visible
    expect(screen.queryByRole("status")).not.toBeInTheDocument()

    // Switch back to edit mode
    fireEvent.click(previewButton)

    // Reading stats should be visible again
    expect(screen.getByRole("status")).toBeInTheDocument()
    expect(screen.getByRole("status").textContent).toContain("Reading Time")
  })

  test("toggles sidebar with left-edge outline trigger", async () => {
    const user = userEvent.setup()
    render(
      <MarkdownEditor initialValue="# Hello World" sidebarEnabled={true} />
    )

    // Initially the sidebar should be collapsed
    expect(screen.queryByTestId("markdown-sidebar")).not.toBeInTheDocument()

    // Find and click the outline trigger
    const outlineTrigger = screen.getByTestId("outline-trigger")
    await user.click(outlineTrigger)

    // Now the sidebar should be visible
    expect(screen.getByTestId("markdown-sidebar")).toBeInTheDocument()

    // Click the trigger again to collapse
    await user.click(outlineTrigger)

    // Sidebar should be hidden again
    expect(screen.queryByTestId("markdown-sidebar")).not.toBeInTheDocument()
  })

  test("outline trigger supports keyboard activation", async () => {
    const user = userEvent.setup()
    render(
      <MarkdownEditor initialValue="# Hello World" sidebarEnabled={true} />
    )

    // Initially the sidebar should be collapsed
    expect(screen.queryByTestId("markdown-sidebar")).not.toBeInTheDocument()

    // Find the outline trigger and focus it
    const outlineTrigger = screen.getByTestId("outline-trigger")
    outlineTrigger.focus()

    // Press Enter to activate
    await user.keyboard("{Enter}")

    // Now the sidebar should be visible
    expect(screen.getByTestId("markdown-sidebar")).toBeInTheDocument()

    // Press Space to toggle it back
    outlineTrigger.focus()
    await user.keyboard(" ")

    // Sidebar should be hidden again
    expect(screen.queryByTestId("markdown-sidebar")).not.toBeInTheDocument()
  })
})
