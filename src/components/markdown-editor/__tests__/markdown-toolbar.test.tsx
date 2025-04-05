import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { MarkdownToolbar } from "../markdown-toolbar"

describe("MarkdownToolbar", () => {
  it("renders all toolbar buttons", () => {
    const mockToggle = jest.fn()
    const mockInsert = jest.fn()
    const mockNewFile = jest.fn()
    const mockSaveFile = jest.fn()
    const mockOpenFile = jest.fn()

    render(
      <MarkdownToolbar
        isPreviewMode={false}
        onTogglePreview={mockToggle}
        onInsertAction={mockInsert}
        onNewFile={mockNewFile}
        onSaveFile={mockSaveFile}
        onOpenFile={mockOpenFile}
      />
    )

    // Check that all buttons are rendered
    expect(screen.getByTestId("toolbar-bold")).toBeInTheDocument()
    expect(screen.getByTestId("toolbar-italic")).toBeInTheDocument()
    expect(screen.getByTestId("toolbar-heading-1")).toBeInTheDocument()
    expect(screen.getByTestId("toolbar-heading-2")).toBeInTheDocument()
    expect(screen.getByTestId("toolbar-link")).toBeInTheDocument()
    expect(screen.getByTestId("toolbar-image")).toBeInTheDocument()
    expect(screen.getByTestId("toolbar-bulleted-list")).toBeInTheDocument()
    expect(screen.getByTestId("toolbar-numbered-list")).toBeInTheDocument()
    expect(screen.getByTestId("toolbar-code")).toBeInTheDocument()
    expect(screen.getByTestId("toolbar-quote")).toBeInTheDocument()
    expect(screen.getByTestId("toggle-preview")).toBeInTheDocument()
    
    // Check file operation buttons
    expect(screen.getByTestId("file-new")).toBeInTheDocument()
    expect(screen.getByTestId("file-open")).toBeInTheDocument()
    expect(screen.getByTestId("file-save")).toBeInTheDocument()
  })

  it("calls onTogglePreview when the preview button is clicked", async () => {
    const mockToggle = jest.fn()
    const mockInsert = jest.fn()
    const mockNewFile = jest.fn()
    const mockSaveFile = jest.fn()
    const mockOpenFile = jest.fn()
    const user = userEvent.setup()

    render(
      <MarkdownToolbar
        isPreviewMode={false}
        onTogglePreview={mockToggle}
        onInsertAction={mockInsert}
        onNewFile={mockNewFile}
        onSaveFile={mockSaveFile}
        onOpenFile={mockOpenFile}
      />
    )

    await user.click(screen.getByTestId("toggle-preview"))
    expect(mockToggle).toHaveBeenCalledTimes(1)
  })

  it("calls onInsertAction with the correct text when a formatting button is clicked", async () => {
    const mockToggle = jest.fn()
    const mockInsert = jest.fn()
    const mockNewFile = jest.fn()
    const mockSaveFile = jest.fn()
    const mockOpenFile = jest.fn()
    const user = userEvent.setup()

    render(
      <MarkdownToolbar
        isPreviewMode={false}
        onTogglePreview={mockToggle}
        onInsertAction={mockInsert}
        onNewFile={mockNewFile}
        onSaveFile={mockSaveFile}
        onOpenFile={mockOpenFile}
      />
    )

    // Test a few formatting buttons
    await user.click(screen.getByTestId("toolbar-bold"))
    expect(mockInsert).toHaveBeenCalledWith("**Bold text**")

    await user.click(screen.getByTestId("toolbar-link"))
    expect(mockInsert).toHaveBeenCalledWith("[Link text](https://example.com)")

    await user.click(screen.getByTestId("toolbar-code"))
    expect(mockInsert).toHaveBeenCalledWith(
      "\n```\nconst example = 'code block';\n```\n"
    )
  })

  it("calls file operation functions when file buttons are clicked", async () => {
    const mockToggle = jest.fn()
    const mockInsert = jest.fn()
    const mockNewFile = jest.fn()
    const mockSaveFile = jest.fn()
    const mockOpenFile = jest.fn()
    const user = userEvent.setup()

    render(
      <MarkdownToolbar
        isPreviewMode={false}
        onTogglePreview={mockToggle}
        onInsertAction={mockInsert}
        onNewFile={mockNewFile}
        onSaveFile={mockSaveFile}
        onOpenFile={mockOpenFile}
      />
    )

    // Test file operation buttons
    await user.click(screen.getByTestId("file-new"))
    expect(mockNewFile).toHaveBeenCalledTimes(1)

    await user.click(screen.getByTestId("file-save"))
    expect(mockSaveFile).toHaveBeenCalledTimes(1)

    await user.click(screen.getByTestId("file-open"))
    expect(mockOpenFile).toHaveBeenCalledTimes(1)
  })

  it("disables formatting buttons in preview mode", () => {
    const mockToggle = jest.fn()
    const mockInsert = jest.fn()
    const mockNewFile = jest.fn()
    const mockSaveFile = jest.fn()
    const mockOpenFile = jest.fn()

    render(
      <MarkdownToolbar
        isPreviewMode={true}
        onTogglePreview={mockToggle}
        onInsertAction={mockInsert}
        onNewFile={mockNewFile}
        onSaveFile={mockSaveFile}
        onOpenFile={mockOpenFile}
      />
    )

    // Check that all formatting buttons are disabled
    expect(screen.getByTestId("toolbar-bold")).toBeDisabled()
    expect(screen.getByTestId("toolbar-italic")).toBeDisabled()
    expect(screen.getByTestId("toolbar-heading-1")).toBeDisabled()

    // Preview toggle button should still be enabled
    expect(screen.getByTestId("toggle-preview")).not.toBeDisabled()
    
    // File operation buttons should still be enabled
    expect(screen.getByTestId("file-new")).not.toBeDisabled()
    expect(screen.getByTestId("file-save")).not.toBeDisabled()
    expect(screen.getByTestId("file-open")).not.toBeDisabled()
  })

  it("shows 'Edit' text when in preview mode", () => {
    const mockToggle = jest.fn()
    const mockInsert = jest.fn()
    const mockNewFile = jest.fn()
    const mockSaveFile = jest.fn()
    const mockOpenFile = jest.fn()

    render(
      <MarkdownToolbar
        isPreviewMode={true}
        onTogglePreview={mockToggle}
        onInsertAction={mockInsert}
        onNewFile={mockNewFile}
        onSaveFile={mockSaveFile}
        onOpenFile={mockOpenFile}
      />
    )

    expect(screen.getByTestId("toggle-preview")).toHaveTextContent("Edit")
  })

  it("shows 'Preview' text when in edit mode", () => {
    const mockToggle = jest.fn()
    const mockInsert = jest.fn()
    const mockNewFile = jest.fn()
    const mockSaveFile = jest.fn()
    const mockOpenFile = jest.fn()

    render(
      <MarkdownToolbar
        isPreviewMode={false}
        onTogglePreview={mockToggle}
        onInsertAction={mockInsert}
        onNewFile={mockNewFile}
        onSaveFile={mockSaveFile}
        onOpenFile={mockOpenFile}
      />
    )

    expect(screen.getByTestId("toggle-preview")).toHaveTextContent("Preview")
  })
})
