import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"

import { MarkdownSidebar } from "../markdown-sidebar"

describe("MarkdownSidebar", () => {
  const renderSidebar = (content: string, onHeadingClick = jest.fn()) =>
    render(
      <MarkdownSidebar
        content={content}
        onHeadingClick={onHeadingClick}
        isCollapsed={false}
      />
    )

  it("shows every sibling heading, not only the first", () => {
    renderSidebar("## One\n\n## Two\n\n## Three")

    expect(screen.getByText("One")).toBeInTheDocument()
    expect(screen.getByText("Two")).toBeInTheDocument()
    expect(screen.getByText("Three")).toBeInTheDocument()
  })

  it("keeps headings after a skipped level", () => {
    renderSidebar("# A\n\n### B\n\n### C")

    expect(screen.getByText("B")).toBeInTheDocument()
    expect(screen.getByText("C")).toBeInTheDocument()
  })

  it("ignores '#' lines inside code blocks", () => {
    renderSidebar("# Title\n\n```bash\n# comment\n```")

    expect(screen.queryByText("comment")).not.toBeInTheDocument()
  })

  it("collapses and expands child headings", () => {
    renderSidebar("# Parent\n\n## Child")

    fireEvent.click(screen.getByRole("button", { name: "Collapse section" }))
    expect(screen.queryByText("Child")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Expand section" }))
    expect(screen.getByText("Child")).toBeInTheDocument()
  })

  it("navigates with the keyboard", () => {
    const onHeadingClick = jest.fn()
    renderSidebar("## What's new?", onHeadingClick)

    fireEvent.keyDown(screen.getByText("What's new?").closest('[role="button"]')!, {
      key: "Enter",
    })
    expect(onHeadingClick).toHaveBeenCalledWith("whats-new")
  })
})
