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
      render(
        <MarkdownAutocomplete
          textarea={textarea}
          value="# "
          cursorPosition={2}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getAllByText(/Heading/).length).toBeGreaterThan(0)
      })
      // Only heading suggestions match the "#" trigger
      expect(screen.getAllByRole("button")).toHaveLength(6)
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
          cursorPosition={`${documentContent}\n\n[Link](#`.length}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText("# Introduction")).toBeInTheDocument()
        expect(screen.getByText("## Getting Started")).toBeInTheDocument()
        expect(screen.getByText("### Installation")).toBeInTheDocument()
      })
      expect(screen.getAllByRole("button")).toHaveLength(3)
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
          cursorPosition={`${documentContent}\n\n[Link](#get`.length}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText("## Getting Started")).toBeInTheDocument()
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
          cursorPosition={`${documentContent}\n\n[Link](#`.length}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText("Line 1")).toBeInTheDocument()
        expect(screen.getByText("Line 3")).toBeInTheDocument()
      })
    })

    it("should replace only the query after # with the header anchor", async () => {
      const documentContent = `# First Header
## Second Header`
      const value = `${documentContent}\n\n[Link](#sec`

      render(
        <MarkdownAutocomplete
          textarea={textarea}
          value={value}
          cursorPosition={value.length}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText("## Second Header")).toBeInTheDocument()
      })

      fireEvent.keyDown(textarea, { key: "Enter" })

      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({ value: "#second-header" }),
        value.length - "sec".length,
        value.length
      )
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

      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({ label: "# Heading 1" }),
        0,
        2
      )
    })

    it("should include the trigger in the replace range", async () => {
      // Typing "#" and picking "## " must produce "## ", not "### "
      render(
        <MarkdownAutocomplete
          textarea={textarea}
          value="#"
          cursorPosition={1}
          onSelect={mockOnSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText("## Heading 2")).toBeInTheDocument()
      })

      fireEvent.keyDown(textarea, { key: "ArrowDown" })
      fireEvent.keyDown(textarea, { key: "Enter" })

      expect(mockOnSelect).toHaveBeenCalledTimes(1)
      const [item, start, end] = mockOnSelect.mock.calls[0]
      expect(item).toEqual(expect.objectContaining({ value: "## " }))
      expect([start, end]).toEqual([0, 1])

      const value = "#"
      expect(value.slice(0, start) + item.value + value.slice(end)).toBe("## ")
    })

    it("should ignore keys another handler already handled", async () => {
      // Registered before the component's listener, so it runs first
      const preventer = (e: KeyboardEvent) => e.preventDefault()
      textarea.addEventListener("keydown", preventer)

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
      fireEvent.keyDown(textarea, { key: "Enter" })
      fireEvent.keyDown(textarea, { key: "Escape" })

      expect(mockOnSelect).not.toHaveBeenCalled()
      expect(screen.getAllByRole("button")[0]).toHaveClass("bg-accent")
      expect(screen.getByText("# Heading 1")).toBeInTheDocument()

      textarea.removeEventListener("keydown", preventer)
    })

    it("should hide autocomplete with Escape key", async () => {
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

      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({ label: "# Heading 1" }),
        0,
        2
      )
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
        expect(screen.getByText("## Heading 2")).toBeInTheDocument()
      })

      const [firstItem, secondItem] = screen.getAllByRole("button")
      expect(firstItem).toHaveClass("bg-accent")

      fireEvent.mouseEnter(secondItem)

      expect(secondItem).toHaveClass("bg-accent")
      expect(firstItem).not.toHaveClass("bg-accent")
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
      // Give the textarea a layout (jsdom has none)
      Object.assign(textarea.style, {
        fontSize: "16px",
        lineHeight: "24px",
        paddingTop: "16px",
        paddingLeft: "24px",
      })
      textarea.getBoundingClientRect = () =>
        ({
          top: 100,
          left: 50,
          right: 450,
          bottom: 400,
          width: 400,
          height: 300,
          x: 50,
          y: 100,
          toJSON: () => ({}),
        }) as DOMRect

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

      const dropdown = screen.getByText("# Heading 1").closest("button")
        ?.parentElement
      expect(dropdown).toHaveClass("fixed")
      // top: rect.top + paddingTop + one line below the caret line
      // left: rect.left + paddingLeft + 2 columns * (16px * 0.6)
      expect(dropdown).toHaveStyle({ top: "140px", left: "93.2px" })
    })
  })
})
