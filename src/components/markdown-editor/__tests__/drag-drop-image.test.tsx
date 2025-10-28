import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { MarkdownInput } from "../markdown-input"

describe("MarkdownInput - Drag and Drop Images", () => {
  it("should show visual feedback when dragging files over the editor", () => {
    const onChange = jest.fn()
    render(<MarkdownInput value="" onChange={onChange} />)

    const container = screen.getByTestId("markdown-input").parentElement
    expect(container).toBeDefined()

    // Create a drag event with files
    const dragEvent = new DragEvent("dragenter", {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
    })

    // Mock the dataTransfer types to include Files
    Object.defineProperty(dragEvent.dataTransfer, "types", {
      value: ["Files"],
    })

    fireEvent(container!, dragEvent)

    // Check that the textarea has the drag-over styling
    const textarea = screen.getByTestId("markdown-input")
    expect(textarea.className).toContain("border-primary")
  })

  it("should insert image markdown when dropping an image file", async () => {
    const onChange = jest.fn()
    render(<MarkdownInput value="# Test" onChange={onChange} />)

    const container = screen.getByTestId("markdown-input").parentElement
    expect(container).toBeDefined()

    // Create a mock image file
    const file = new File(["image content"], "test-image.png", {
      type: "image/png",
    })

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: jest.fn(function (this: FileReader) {
        // Simulate successful read
        setTimeout(() => {
          // @ts-ignore
          this.onload?.({
            target: { result: "data:image/png;base64,mockbase64data" },
          })
        }, 0)
      }),
    }

    global.FileReader = jest.fn(() => mockFileReader) as any

    // Create drop event
    const dropEvent = new DragEvent("drop", {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
    })

    // Add the file to the dataTransfer
    Object.defineProperty(dropEvent.dataTransfer, "files", {
      value: [file],
    })
    Object.defineProperty(dropEvent.dataTransfer, "types", {
      value: ["Files"],
    })

    fireEvent(container!, dropEvent)

    // Wait for the async file reading to complete
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled()
    })

    // Check that the onChange was called with image markdown
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall).toContain("![test-image](data:image/png;base64,mockbase64data)")
  })

  it("should handle multiple image files dropped at once", async () => {
    const onChange = jest.fn()
    render(<MarkdownInput value="" onChange={onChange} />)

    const container = screen.getByTestId("markdown-input").parentElement
    expect(container).toBeDefined()

    // Create multiple mock image files
    const file1 = new File(["image1"], "image1.jpg", { type: "image/jpeg" })
    const file2 = new File(["image2"], "image2.png", { type: "image/png" })

    // Mock FileReader
    let callCount = 0
    const mockFileReader = {
      readAsDataURL: jest.fn(function (this: FileReader) {
        const index = callCount++
        setTimeout(() => {
          // @ts-ignore
          this.onload?.({
            target: { result: `data:image/test;base64,mockdata${index}` },
          })
        }, 0)
      }),
    }

    global.FileReader = jest.fn(() => mockFileReader) as any

    // Create drop event with multiple files
    const dropEvent = new DragEvent("drop", {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
    })

    Object.defineProperty(dropEvent.dataTransfer, "files", {
      value: [file1, file2],
    })
    Object.defineProperty(dropEvent.dataTransfer, "types", {
      value: ["Files"],
    })

    fireEvent(container!, dropEvent)

    // Wait for the async file reading to complete
    await waitFor(() => {
      expect(onChange).toHaveBeenCalled()
    })

    // Check that the onChange was called with both images
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall).toContain("![image1]")
    expect(lastCall).toContain("![image2]")
  })

  it("should ignore non-image files", async () => {
    const onChange = jest.fn()
    render(<MarkdownInput value="" onChange={onChange} />)

    const container = screen.getByTestId("markdown-input").parentElement
    expect(container).toBeDefined()

    // Create a non-image file
    const file = new File(["text content"], "document.txt", {
      type: "text/plain",
    })

    // Create drop event
    const dropEvent = new DragEvent("drop", {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
    })

    Object.defineProperty(dropEvent.dataTransfer, "files", {
      value: [file],
    })
    Object.defineProperty(dropEvent.dataTransfer, "types", {
      value: ["Files"],
    })

    fireEvent(container!, dropEvent)

    // Wait a bit to ensure no async operations were triggered
    await new Promise((resolve) => setTimeout(resolve, 100))

    // onChange should not have been called since no images were dropped
    expect(onChange).not.toHaveBeenCalled()
  })

  it("should reset drag-over state when drag leaves the editor", () => {
    const onChange = jest.fn()
    render(<MarkdownInput value="" onChange={onChange} />)

    const container = screen.getByTestId("markdown-input").parentElement
    expect(container).toBeDefined()

    // Start drag
    const dragEnterEvent = new DragEvent("dragenter", {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
    })
    Object.defineProperty(dragEnterEvent.dataTransfer, "types", {
      value: ["Files"],
    })
    fireEvent(container!, dragEnterEvent)

    const textarea = screen.getByTestId("markdown-input")
    expect(textarea.className).toContain("border-primary")

    // Mock getBoundingClientRect to simulate leaving the container
    const mockGetBoundingClientRect = jest.fn(() => ({
      left: 0,
      right: 100,
      top: 0,
      bottom: 100,
    }))
    container!.getBoundingClientRect = mockGetBoundingClientRect

    // Drag leave with coordinates outside the container
    const dragLeaveEvent = new DragEvent("dragleave", {
      bubbles: true,
      cancelable: true,
      clientX: 200, // Outside the container
      clientY: 200, // Outside the container
      dataTransfer: new DataTransfer(),
    })
    fireEvent(container!, dragLeaveEvent)

    // The drag-over styling should be removed
    expect(textarea.className).not.toContain("border-primary")
  })
})
