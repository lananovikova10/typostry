import { render, screen } from "@testing-library/react"
import { ReadingStats } from "../reading-stats"

// Mock the next-themes module
jest.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
  }),
}))

describe("ReadingStats", () => {
  it("renders empty stats for empty content", () => {
    render(<ReadingStats content="" />)

    expect(screen.getByText("Reading Time:")).toBeInTheDocument()
    expect(screen.getByText("0")).toBeInTheDocument()
    expect(screen.getByText("min read")).toBeInTheDocument()
    expect(screen.getByText("Words:")).toBeInTheDocument()
    expect(screen.getByText("Sentences:")).toBeInTheDocument()
  })

  it("renders correct stats for sample content", () => {
    const sampleText = "This is a test sentence. This is another sentence."
    render(<ReadingStats content={sampleText} />)

    expect(screen.getByText("Reading Time:")).toBeInTheDocument()
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("min read")).toBeInTheDocument()
    expect(screen.getByText("Words:")).toBeInTheDocument()
    expect(screen.getByText("9")).toBeInTheDocument()
    expect(screen.getByText("Sentences:")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("applies custom class names", () => {
    const customClass = "test-custom-class"
    render(<ReadingStats content="" className={customClass} />)

    const statsElement = screen.getByRole("status")
    expect(statsElement).toHaveClass(customClass)
  })

  it("has appropriate ARIA attributes for accessibility", () => {
    render(<ReadingStats content="" />)

    const statsElement = screen.getByRole("status")
    expect(statsElement).toHaveAttribute("aria-live", "polite")
  })
})