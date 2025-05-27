import { render, screen } from "@testing-library/react"

import { ModeToggle } from "../mode-toggle"
import { ThemeProvider } from "../theme-provider"

// Mock the useTheme hook from next-themes
jest.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: jest.fn(),
  }),
}))

describe("ModeToggle", () => {
  // Helper function to render the component with the ThemeProvider
  const renderWithThemeProvider = () => {
    return render(
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ModeToggle />
      </ThemeProvider>
    )
  }

  it("renders the theme toggle button correctly", () => {
    renderWithThemeProvider()

    // Check that the button is rendered with accessibility label
    const button = screen.getByRole("button", { name: /toggle theme/i })
    expect(button).toBeInTheDocument()

    // Check that the button has the correct styling classes
    expect(button).toHaveClass("flex")
    expect(button).toHaveClass("items-center")
    expect(button).toHaveClass("justify-center")
  })

  it("matches snapshot", () => {
    const { container } = renderWithThemeProvider()
    expect(container).toMatchSnapshot()
  })

  it("contains the correct screen reader text", () => {
    renderWithThemeProvider()
    expect(screen.getByText("Toggle theme")).toBeInTheDocument()
    expect(screen.getByText("Toggle theme")).toHaveClass("sr-only")
  })

  it("has properly positioned icons", () => {
    renderWithThemeProvider()

    // Get the button
    const button = screen.getByRole("button", { name: /toggle theme/i })

    // Check if SVG icons are present inside the button
    const icons = button.querySelectorAll("svg")
    expect(icons.length).toBeGreaterThan(0)

    // Check that the moon and contrast icons have absolute positioning with translate transforms
    const moonIcon = button.querySelector('svg[class*="absolute"]')
    expect(moonIcon).toHaveClass("absolute")
    expect(moonIcon).toHaveClass("left-1/2")
    expect(moonIcon).toHaveClass("top-1/2")
    expect(moonIcon).toHaveClass("-translate-x-1/2")
    expect(moonIcon).toHaveClass("-translate-y-1/2")
  })
})
