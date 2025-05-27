import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { OutlineTrigger } from "../outline-trigger"

describe("OutlineTrigger", () => {
  it("renders the outline trigger button", () => {
    const mockToggle = jest.fn()
    
    render(
      <OutlineTrigger isCollapsed={true} onToggle={mockToggle} />
    )
    
    const trigger = screen.getByTestId("outline-trigger")
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveAttribute("aria-label", "Open document outline")
    expect(trigger).toHaveAttribute("role", "button")
  })

  it("calls onToggle when clicked", async () => {
    const mockToggle = jest.fn()
    const user = userEvent.setup()
    
    render(
      <OutlineTrigger isCollapsed={true} onToggle={mockToggle} />
    )
    
    const trigger = screen.getByTestId("outline-trigger")
    await user.click(trigger)
    
    expect(mockToggle).toHaveBeenCalledTimes(1)
  })

  it("calls onToggle when pressing Enter key", async () => {
    const mockToggle = jest.fn()
    const user = userEvent.setup()
    
    render(
      <OutlineTrigger isCollapsed={true} onToggle={mockToggle} />
    )
    
    const trigger = screen.getByTestId("outline-trigger")
    trigger.focus()
    await user.keyboard("{Enter}")
    
    expect(mockToggle).toHaveBeenCalledTimes(1)
  })

  it("calls onToggle when pressing Space key", async () => {
    const mockToggle = jest.fn()
    const user = userEvent.setup()
    
    render(
      <OutlineTrigger isCollapsed={true} onToggle={mockToggle} />
    )
    
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
    
    // When collapsed, the primary indicator should not be present
    expect(screen.getByTestId("outline-trigger").querySelector(".bg-primary")).not.toBeInTheDocument()
    
    // Rerender with isCollapsed=false
    rerender(
      <OutlineTrigger isCollapsed={false} onToggle={mockToggle} />
    )
    
    // When expanded, the primary indicator should be present
    expect(screen.getByTestId("outline-trigger").querySelector(".bg-primary")).toBeInTheDocument()
  })
})