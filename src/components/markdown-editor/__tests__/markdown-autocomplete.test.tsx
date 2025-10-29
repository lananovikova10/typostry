import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MarkdownAutocomplete, AutocompleteItem } from "../markdown-autocomplete"

describe("MarkdownAutocomplete", () => {
  let textarea: HTMLTextAreaElement
  const mockOnSelect = jest.fn()

  beforeEach(() => {
    textarea = document.createElement("textarea")
    document.body.appendChild(textarea)
    mockOnSelect.mockClear()
  })

  afterEach(() => {
    document.body.removeChild(textarea)
  })

  describe("Markdown Syntax Autocomplete", () => {
    it("should show autocomplete when typing heading syntax", async () => {
      const { rerender } = render(
        <MarkdownAutocomplete
          textarea={textarea}
          value="# "
          cursorPosition={2}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.queryByText(/Heading/)).toBeInTheDocument()
      })
    })

    it("should show all heading options when typing #", async () => {
      render(
        <MarkdownAutocomplete
          textarea={textarea}
          value="# "
          cursorPosition={2}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText("# Heading 1")).toBeInTheDocument()
        expect(screen.getByText("## Heading 2")).toBeInTheDocument()
        expect(screen.getByText("### Heading 3")).toBeInTheDocument()
      })
    })

    it("should show list autocomplete when typing -", async () => {
      render(
        <MarkdownAutocomplete
          textarea={textarea}
          value="- "
          cursorPosition={2}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText("- List Item")).toBeInTheDocument()
        expect(screen.getByText("- [ ] Task")).toBeInTheDocument()
      })
    })

    it("should show code block autocomplete when typing ```", async () => {
      render(
        <MarkdownAutocomplete
          textarea={textarea}
          value="```"
          cursorPosition={3}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText("```Code Block```")).toBeInTheDocument()
      })
    })

    it("should filter suggestions based on query", async () => {
      render(
        <MarkdownAutocomplete
          textarea={textarea}
          value="# Heading"
          cursorPosition={9}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        const items = screen.queryAllByText(/Heading/)
        expect(items.length).toBeGreaterThan(0)
      })
    })
  })

  describe("Header Reference Autocomplete", () => {
    it("should show header references when typing [text](#", async () => {
      const documentContent = `# Introduction
## Getting Started
### Installation`

      render(
        <MarkdownAutocomplete
          textarea={textarea}
          value={`${documentContent}\n\n[Link](#`}
          cursorPosition={documentContent.length + 9}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/Introduction/)).toBeInTheDocument()
        expect(screen.getByText(/Getting Started/)).toBeInTheDocument()
        expect(screen.getByText(/Installation/)).toBeInTheDocument()
      })
    })

    it("should filter headers based on query", async () => {
      const documentContent = `# Introduction
## Getting Started
### Installation
## Configuration`

      render(
        <MarkdownAutocomplete
          textarea={textarea}
          value={`${documentContent}\n\n[Link](#get`}
          cursorPosition={documentContent.length + 12}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/Getting Started/)).toBeInTheDocument()
        expect(screen.queryByText(/Installation/)).not.toBeInTheDocument()
        expect(screen.queryByText(/Configuration/)).not.toBeInTheDocument()
      })
    })

    it("should include line numbers in header descriptions", async () => {
      const documentContent = `# First Header
Some content
## Second Header`

      render(
        <MarkdownAutocomplete
          textarea={textarea}
          value={`${documentContent}\n\n[Link](#`}
          cursorPosition={documentContent.length + 9}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText("Line 1")).toBeInTheDocument()
        expect(screen.getByText("Line 3")).toBeInTheDocument()
      })
    })
  })

  describe("Keyboard Navigation", () => {
    it("should navigate down with ArrowDown key", async () => {
      render(
        <MarkdownAutocomplete
          textarea={textarea}
          value="# "
          cursorPosition={2}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText("# Heading 1")).toBeInTheDocument()
      })

      fireEvent.keyDown(textarea, { key: "ArrowDown" })

      // Check that the second item is now selected (via CSS class)
      const items = screen.getAllByRole("button")
      expect(items[1]).toHaveClass("bg-accent")
    })

    it("should navigate up with ArrowUp key", async () => {
      render(
        <MarkdownAutocomplete
          textarea={textarea}
          value="# "
          cursorPosition={2}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText("# Heading 1")).toBeInTheDocument()
      })

      // Navigate down twice
      fireEvent.keyDown(textarea, { key: "ArrowDown" })
      fireEvent.keyDown(textarea, { key: "ArrowDown" })

      // Navigate back up
      fireEvent.keyDown(textarea, { key: "ArrowUp" })

      const items = screen.getAllByRole("button")
      expect(items[1]).toHaveClass("bg-accent")
    })

    it("should select item with Enter key", async () => {
      render(
        <MarkdownAutocomplete
          textarea={textarea}
          value="# "
          cursorPosition={2}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText("# Heading 1")).toBeInTheDocument()
      })

      fireEvent.keyDown(textarea, { key: "Enter" })

      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({ label: "# Heading 1" }),
        0,
        2
      )
    })

    it("should select item with Tab key", async () => {
      render(
        <MarkdownAutocomplete
          textarea={textarea}
          value="# "
          cursorPosition={2}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText("# Heading 1")).toBeInTheDocument()
      })

      fireEvent.keyDown(textarea, { key: "Tab" })

      expect(mockOnSelect).toHaveBeenCalled()
    })

    it("should hide autocomplete with Escape key", async () => {
      const { rerender } = render(
        <MarkdownAutocomplete
          textarea={textarea}
          value="# "
          cursorPosition={2}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText("# Heading 1")).toBeInTheDocument()
      })

      fireEvent.keyDown(textarea, { key: "Escape" })

      // Autocomplete should no longer be visible
      await waitFor(() => {
        expect(screen.queryByText("# Heading 1")).not.toBeInTheDocument()
      })
    })
  })

  describe("Mouse Interaction", () => {
    it("should select item on click", async () => {
      render(
        <MarkdownAutocomplete
          textarea={textarea}
          value="# "
          cursorPosition={2}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText("# Heading 1")).toBeInTheDocument()
      })

      const item = screen.getByText("# Heading 1")
      fireEvent.click(item)

      expect(mockOnSelect).toHaveBeenCalled()
    })

    it("should highlight item on hover", async () => {
      render(
        <MarkdownAutocomplete
          textarea={textarea}
          value="# "
          cursorPosition={2}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText("# Heading 2")).toBeInTheDocument()
      })

      const secondItem = screen.getAllByRole("button")[1]
      fireEvent.mouseEnter(secondItem)

      expect(secondItem).toHaveClass("bg-accent")
    })
  })

  describe("Visibility", () => {
    it("should not show autocomplete when no triggers match", () => {
      const { container } = render(
        <MarkdownAutocomplete
          textarea={textarea}
          value="Regular text"
          cursorPosition={12}
          onSelect={mockOnSelect}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it("should hide when items list is empty", () => {
      const { container } = render(
        <MarkdownAutocomplete
          textarea={textarea}
          value="xyz"
          cursorPosition={3}
          onSelect={mockOnSelect}
        />
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe("Position Calculation", () => {
    it("should position autocomplete near cursor", async () => {
      render(
        <MarkdownAutocomplete
          textarea={textarea}
          value="# "
          cursorPosition={2}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        const dropdown = screen.getByText("# Heading 1").closest("div")
        expect(dropdown).toHaveStyle({ position: "fixed" })
      })
    })
  })
})
