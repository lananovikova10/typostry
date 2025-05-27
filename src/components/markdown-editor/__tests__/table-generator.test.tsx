import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { generateTableMarkdown, TableGenerator } from "../table-generator"

describe("TableGenerator", () => {
  it("renders a table button with tooltip", async () => {
    const mockInsert = jest.fn()
    const user = userEvent.setup()

    render(<TableGenerator onInsertTable={mockInsert} isDisabled={false} />)

    expect(screen.getByTestId("toolbar-table")).toBeInTheDocument()

    // Open tooltip
    await user.hover(screen.getByTestId("toolbar-table"))
    expect(screen.getByText("Insert table")).toBeInTheDocument()
  })

  it("opens the table grid popover when clicked", async () => {
    const mockInsert = jest.fn()
    const user = userEvent.setup()

    render(<TableGenerator onInsertTable={mockInsert} isDisabled={false} />)

    await user.click(screen.getByTestId("toolbar-table"))

    // Check that the grid appears
    expect(screen.getByTestId("table-grid-popover")).toBeInTheDocument()
    expect(screen.getByText("Hover to select table size")).toBeInTheDocument()
    expect(
      screen.getByText("Max size: 10 rows × 8 columns")
    ).toBeInTheDocument()
  })

  it("shows the dimensions when hovering over cells", async () => {
    const mockInsert = jest.fn()
    const user = userEvent.setup()

    render(<TableGenerator onInsertTable={mockInsert} isDisabled={false} />)

    await user.click(screen.getByTestId("toolbar-table"))

    // Hover over a cell (3×4)
    await user.hover(screen.getByLabelText("Select 3×4 table"))

    // Check that the dimensions text is updated
    expect(screen.getByText("3 × 4 table")).toBeInTheDocument()
  })

  it("calls onInsertTable with correctly formatted markdown when a cell is selected", async () => {
    const mockInsert = jest.fn()
    const user = userEvent.setup()

    render(<TableGenerator onInsertTable={mockInsert} isDisabled={false} />)

    await user.click(screen.getByTestId("toolbar-table"))

    // Click on a 2×3 table cell
    await user.click(screen.getByLabelText("Select 2×3 table"))

    // Check that onInsertTable was called with the correct markdown
    expect(mockInsert).toHaveBeenCalledTimes(1)

    const expectedTable = `| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
|          |          |          |
`
    expect(mockInsert).toHaveBeenCalledWith(expectedTable)
  })

  it("is disabled when isDisabled is true", () => {
    const mockInsert = jest.fn()

    render(<TableGenerator onInsertTable={mockInsert} isDisabled={true} />)

    expect(screen.getByTestId("toolbar-table")).toBeDisabled()
  })

  describe("generateTableMarkdown", () => {
    it("generates a 1×1 table correctly", () => {
      const result = generateTableMarkdown(1, 1)
      const expected = `| Header 1 |
|----------|
|          |
`
      expect(result).toEqual(expected)
    })

    it("generates a 3×4 table correctly", () => {
      const result = generateTableMarkdown(3, 4)
      const expected = `| Header 1 | Header 2 | Header 3 | Header 4 |
|----------|----------|----------|----------|
|          |          |          |          |
|          |          |          |          |
|          |          |          |          |
`
      expect(result).toEqual(expected)
    })

    it("generates a 10×8 table correctly (max dimensions)", () => {
      const result = generateTableMarkdown(10, 8)

      // Check the header row has 8 columns
      const headerRow = result.split("\n")[0]
      const headerCount = (headerRow.match(/\| Header \d+ /g) || []).length
      expect(headerCount).toBe(8)

      // Check we have 10 data rows plus header and separator (12 total)
      const rowCount = result.split("\n").filter((line) => line.trim()).length
      expect(rowCount).toBe(12)
    })
  })
})
