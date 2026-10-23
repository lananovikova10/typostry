import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { MarkdownInput } from "../markdown-input"

// The styled wrapper that receives the drag-over styling
const getDropTarget = () => screen.getByTestId("markdown-input").parentElement!

// The outer editor root (holds the drag handlers and is used for bounds checks)
const getEditorRoot = () => getDropTarget().parentElement!

const createDragEvent = (
  type: string,
  {
    files = [],
    types = ["Files"],
    init = {},
  }: { files?: File[]; types?: string[]; init?: MouseEventInit } = {}
) => {
  const event = new DragEvent(type, {
    bubbles: true,
    cancelable: true,
    dataTransfer: new DataTransfer(),
    ...init,
  })
  Object.defineProperty(event.dataTransfer, "files", { value: files })
  Object.defineProperty(event.dataTransfer, "types", { value: types })
  return event
}

describe("MarkdownInput - Drag and Drop Images", () => {
  const originalFetch = global.fetch
  let fetchMock: jest.Mock

  beforeEach(() => {
    let uploadCount = 0
    fetchMock = jest.fn(async (_url: string, init?: RequestInit) => {
      const file = (init?.body as FormData).get("file") as File
      const index = uploadCount++
      return {
        ok: true,
        json: async () => ({ url: `/uploads/${index}-${file.name}` }),
      }
    })
    global.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it("should show visual feedback when dragging files over the editor", () => {
    const onChange = jest.fn()
    render(<MarkdownInput value="" onChange={onChange} />)

    const dropTarget = getDropTarget()
    expect(dropTarget.className).not.toContain("border-primary")

    fireEvent(dropTarget, createDragEvent("dragenter"))

    expect(dropTarget.className).toContain("border-primary")
    expect(dropTarget.className).toContain("border-dashed")
  })

  it("should insert image markdown when dropping an image file", async () => {
    const onChange = jest.fn()
    render(<MarkdownInput value="# Test" onChange={onChange} />)

    const file = new File(["image content"], "test-image.png", {
      type: "image/png",
    })

    fireEvent(getDropTarget(), createDragEvent("drop", { files: [file] }))

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled()
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/upload",
      expect.objectContaining({ method: "POST" })
    )

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall).toContain("![test-image](/uploads/0-test-image.png)")
    expect(lastCall).toContain("# Test")
  })

  it("should handle multiple image files dropped at once", async () => {
    const onChange = jest.fn()
    render(<MarkdownInput value="" onChange={onChange} />)

    const file1 = new File(["image1"], "image1.jpg", { type: "image/jpeg" })
    const file2 = new File(["image2"], "image2.png", { type: "image/png" })

    fireEvent(
      getDropTarget(),
      createDragEvent("drop", { files: [file1, file2] })
    )

    await waitFor(() => {
      expect(onChange).toHaveBeenCalled()
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0]
    expect(lastCall).toContain("![image1](/uploads/0-image1.jpg)")
    expect(lastCall).toContain("![image2](/uploads/1-image2.png)")
  })

  it("should ignore non-image files", async () => {
    const onChange = jest.fn()
    render(<MarkdownInput value="" onChange={onChange} />)

    const file = new File(["text content"], "document.txt", {
      type: "text/plain",
    })

    fireEvent(getDropTarget(), createDragEvent("drop", { files: [file] }))

    // Wait a bit to ensure no async operations were triggered
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it("should reset drag-over state when drag leaves the editor", () => {
    const onChange = jest.fn()
    render(<MarkdownInput value="" onChange={onChange} />)

    const dropTarget = getDropTarget()

    fireEvent(dropTarget, createDragEvent("dragenter"))
    expect(dropTarget.className).toContain("border-primary")

    // Give the editor root real bounds so the leave position can be checked
    getEditorRoot().getBoundingClientRect = jest.fn(
      () =>
        ({
          left: 0,
          right: 100,
          top: 0,
          bottom: 100,
          width: 100,
          height: 100,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect
    )

    // Leaving to a point still inside the editor keeps the styling
    fireEvent(
      dropTarget,
      createDragEvent("dragleave", { init: { clientX: 50, clientY: 50 } })
    )
    expect(dropTarget.className).toContain("border-primary")

    // Leaving to a point outside the editor removes the styling
    fireEvent(
      dropTarget,
      createDragEvent("dragleave", { init: { clientX: 200, clientY: 200 } })
    )
    expect(dropTarget.className).not.toContain("border-primary")
  })
})
