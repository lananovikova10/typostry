import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { act } from "react-dom/test-utils"

import { OutlineTrigger } from "../outline-trigger"

// Mock framer-motion to avoid test issues
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}))

// Mock tooltip to avoid Portal issues in tests
jest.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }) => <>{children}</>,
  TooltipTrigger: ({ children }) => <>{children}</>,
  TooltipContent: ({ children }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipProvider: ({ children }) => <>{children}</>,
}))

describe("OutlineTrigger", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("renders the outline trigger button with absolute positioning", () => {
    const mockToggle = jest.fn()

    render(<OutlineTrigger isCollapsed={true} onToggle={mockToggle} />)

    const trigger = screen.getByTestId("outline-trigger")
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveAttribute("aria-label", "Show document outline")
    expect(trigger).toHaveAttribute("role", "button")

    // Check for absolute positioning classes
    expect(trigger.className).toContain("absolute")
    expect(trigger.className).toContain("left-2")
    expect(trigger.className).toContain("top-1/2")
    expect(trigger.className).toContain("z-[1000]")
  })

  it("calls onToggle when clicked", async () => {
    const mockToggle = jest.fn()
    const user = userEvent.setup()

    render(<OutlineTrigger isCollapsed={true} onToggle={mockToggle} />)

    const trigger = screen.getByTestId("outline-trigger")
    await user.click(trigger)

    expect(mockToggle).toHaveBeenCalledTimes(1)
  })

  it("calls onToggle when pressing Enter key", async () => {
    const mockToggle = jest.fn()
    const user = userEvent.setup()

    render(<OutlineTrigger isCollapsed={true} onToggle={mockToggle} />)

    const trigger = screen.getByTestId("outline-trigger")
    trigger.focus()
    await user.keyboard("{Enter}")

    expect(mockToggle).toHaveBeenCalledTimes(1)
  })

  it("calls onToggle when pressing Space key", async () => {
    const mockToggle = jest.fn()
    const user = userEvent.setup()

    render(<OutlineTrigger isCollapsed={true} onToggle={mockToggle} />)

    const trigger = screen.getByTestId("outline-trigger")
    trigger.focus()
    await user.keyboard(" ")

    expect(mockToggle).toHaveBeenCalledTimes(1)
  })

  it("shows a visual indicator when outline is open", () => {
    const mockToggle = jest.fn()

    const { rerender } = render(
      <OutlineTrigger isCollapsed={true} onToggle={mockToggle} />
    )

    // When collapsed, the open indicator should not be present
    expect(
      screen.queryByTestId("outline-trigger").querySelector(".bg-primary")
    ).not.toBeInTheDocument()

    // Rerender with isCollapsed=false
    rerender(<OutlineTrigger isCollapsed={false} onToggle={mockToggle} />)

    // When expanded, the open indicator should be present
    expect(
      screen.getByTestId("outline-trigger").querySelector(".bg-primary")
    ).toBeInTheDocument()
  })

  it("includes an icon for visual indication", () => {
    const mockToggle = jest.fn()

    render(<OutlineTrigger isCollapsed={true} onToggle={mockToggle} />)

    // Check that the icon is present
    expect(
      screen.getByTestId("outline-trigger").querySelector("svg")
    ).toBeInTheDocument()
  })

  it("contains the tooltip text", () => {
    const mockToggle = jest.fn()

    render(<OutlineTrigger isCollapsed={true} onToggle={mockToggle} />)

    // Check that the tooltip content is present
    const tooltipContent = screen.getByTestId("tooltip-content")
    expect(tooltipContent.textContent).toContain("Show document outline")
  })

  it("triggers animation after a delay", async () => {
    const mockToggle = jest.fn()

    render(<OutlineTrigger isCollapsed={true} onToggle={mockToggle} />)

    // Advance timers to trigger animation
    act(() => {
      jest.advanceTimersByTime(3000)
    })

    // Animation should be triggered (we can't easily test the actual animation)
    // but we can verify the component doesn't crash after the timeout
    const trigger = screen.getByTestId("outline-trigger")
    expect(trigger).toBeInTheDocument()
  })
})
