import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { fetchTemplateContent } from "@/lib/gitlab"

import { TemplateSelector } from "../template-selector"

// Mock fetch
global.fetch = vi.fn()

// Mock the fetchTemplateContent function
vi.mock("@/lib/gitlab", () => ({
  fetchTemplateContent: vi.fn(),
  formatTemplateName: (name: string) => {
    return name
      .replace("template_", "")
      .replace(".md", "")
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  },
  getTemplatePreview: (content: string, lines = 3) => {
    return content.split("\n").slice(0, lines).join("\n")
  },
}))

describe("TemplateSelector", () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelectTemplate: vi.fn(),
  }

  const mockTemplates = [
    {
      id: "1",
      name: "template_api-reference.md",
      type: "blob",
      path: "api-reference/template_api-reference.md",
    },
    {
      id: "2",
      name: "template_how-to.md",
      type: "blob",
      path: "how-to/template_how-to.md",
    },
  ]

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("displays loading state initially", async () => {
    // Mock fetch to delay response
    vi.mocked(fetch).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    )

    render(<TemplateSelector {...mockProps} />)

    // Assert loading indicator is shown
    expect(screen.getByText("Loading templates...")).toBeInTheDocument()
  })

  it("displays templates after successful fetch", async () => {
    // Mock successful API response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTemplates),
    } as Response)

    render(<TemplateSelector {...mockProps} />)

    // Wait for templates to load
    await waitFor(() => {
      expect(screen.queryByText("Loading templates...")).not.toBeInTheDocument()
    })

    // Assert templates are rendered
    expect(screen.getByText("Api Reference")).toBeInTheDocument()
    expect(screen.getByText("How To")).toBeInTheDocument()
  })

  it("displays error message when fetch fails", async () => {
    // Mock failed API response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      statusText: "Internal Server Error",
      json: () => Promise.resolve({ error: "Failed to fetch templates" }),
    } as Response)

    render(<TemplateSelector {...mockProps} />)

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText("Failed to fetch templates")).toBeInTheDocument()
    })

    // Check if the "Try again" button is present
    expect(screen.getByText("Try again")).toBeInTheDocument()
  })

  it("displays empty state when no templates are available", async () => {
    // Mock empty API response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response)

    render(<TemplateSelector {...mockProps} />)

    // Wait for empty state to be displayed
    await waitFor(() => {
      expect(screen.getByText("No templates available")).toBeInTheDocument()
    })
  })

  it("fetches template content when a template is selected", async () => {
    // Mock successful API response for templates list
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTemplates),
    } as Response)

    // Mock successful template content fetch
    const mockContent = "# API Reference Template\n\nSample content here"
    vi.mocked(fetchTemplateContent).mockResolvedValueOnce(mockContent)

    render(<TemplateSelector {...mockProps} />)

    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText("Api Reference")).toBeInTheDocument()
    })

    // Click on a template
    await userEvent.click(screen.getByText("Api Reference"))

    // Verify that fetchTemplateContent was called with the correct path
    expect(fetchTemplateContent).toHaveBeenCalledWith(
      "api-reference/template_api-reference.md"
    )

    // Verify preview is displayed
    await waitFor(() => {
      expect(screen.getByText("# API Reference Template")).toBeInTheDocument()
    })
  })

  it("closes the modal and calls onSelectTemplate when Insert Template button is clicked", async () => {
    // Mock successful API response for templates list
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTemplates),
    } as Response)

    // Mock successful template content fetch
    const mockContent = "# API Reference Template\n\nSample content here"
    vi.mocked(fetchTemplateContent).mockResolvedValueOnce(mockContent)

    render(<TemplateSelector {...mockProps} />)

    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText("Api Reference")).toBeInTheDocument()
    })

    // Click on a template
    await userEvent.click(screen.getByText("Api Reference"))

    // Wait for content to load
    await waitFor(() => {
      expect(screen.getByText("# API Reference Template")).toBeInTheDocument()
    })

    // Click Insert Template button
    await userEvent.click(screen.getByText("Insert Template"))

    // Verify onSelectTemplate and onClose were called
    expect(mockProps.onSelectTemplate).toHaveBeenCalledWith(mockContent)
    expect(mockProps.onClose).toHaveBeenCalled()
  })
})
