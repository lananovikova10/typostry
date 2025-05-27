import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import * as gitlabApi from "@/lib/gitlab"

import { TemplateModal } from "../index"

// Mock the gitlab API functions
jest.mock("@/lib/gitlab", () => ({
  fetchTemplateFiles: jest.fn(),
  fetchTemplateContent: jest.fn(),
  formatTemplateName: (name: string) => {
    return name
      .replace("template_", "")
      .replace(".md", "")
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  },
  getTemplatePreview: (content: string, lines = 5) => {
    return content.split("\n").slice(0, lines).join("\n")
  },
}))

describe("TemplateModal", () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSelectTemplate: jest.fn(),
  }

  const mockTemplates = [
    {
      id: "1",
      name: "template_api-reference.md",
      type: "blob" as const,
      path: "api-reference/template_api-reference.md",
      mode: "100644",
    },
    {
      id: "2",
      name: "template_how-to.md",
      type: "blob" as const,
      path: "how-to/template_how-to.md",
      mode: "100644",
    },
  ]

  const mockTemplateContent = "# API Reference Template\n\nSample content here"

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("displays loading state initially", async () => {
    // Mock fetchTemplateFiles to delay response
    ;(gitlabApi.fetchTemplateFiles as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
    )

    render(<TemplateModal {...mockProps} />)

    // Assert loading indicator is shown
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument()
    expect(screen.getByText("Loading templates...")).toBeInTheDocument()
  })

  it("displays templates after successful fetch", async () => {
    // Mock successful API response
    ;(gitlabApi.fetchTemplateFiles as jest.Mock).mockResolvedValueOnce(
      mockTemplates
    )

    render(<TemplateModal {...mockProps} />)

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
    ;(gitlabApi.fetchTemplateFiles as jest.Mock).mockRejectedValueOnce(
      new Error("Failed to fetch templates")
    )

    render(<TemplateModal {...mockProps} />)

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText("Failed to fetch templates")).toBeInTheDocument()
    })

    // Check if the "Try again" button is present
    expect(screen.getByText("Try again")).toBeInTheDocument()
  })

  it("displays empty state when no templates are available", async () => {
    // Mock empty API response
    ;(gitlabApi.fetchTemplateFiles as jest.Mock).mockResolvedValueOnce([])

    render(<TemplateModal {...mockProps} />)

    // Wait for empty state to be displayed
    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toBeInTheDocument()
      expect(screen.getByText("No templates available")).toBeInTheDocument()
    })
  })

  it("retries template fetch when try again button is clicked", async () => {
    // First request fails
    const mockFetchTemplates = gitlabApi.fetchTemplateFiles as jest.Mock
    mockFetchTemplates
      .mockRejectedValueOnce(new Error("Failed to fetch templates"))
      // Second request succeeds
      .mockResolvedValueOnce(mockTemplates)

    render(<TemplateModal {...mockProps} />)

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText("Failed to fetch templates")).toBeInTheDocument()
    })

    // Click try again button
    await userEvent.click(screen.getByText("Try again"))

    // Verify fetchTemplateFiles was called twice
    expect(gitlabApi.fetchTemplateFiles).toHaveBeenCalledTimes(2)

    // Wait for templates to load after retry
    await waitFor(() => {
      expect(screen.getByText("Api Reference")).toBeInTheDocument()
      expect(screen.getByText("How To")).toBeInTheDocument()
    })
  })

  it("fetches template content when a template is selected", async () => {
    // Mock successful API responses
    ;(gitlabApi.fetchTemplateFiles as jest.Mock)
      .mockResolvedValueOnce(mockTemplates)(
        gitlabApi.fetchTemplateContent as jest.Mock
      )
      .mockResolvedValueOnce(mockTemplateContent)

    render(<TemplateModal {...mockProps} />)

    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText("Api Reference")).toBeInTheDocument()
    })

    // Click on a template
    await userEvent.click(screen.getByText("Api Reference"))

    // Verify that fetchTemplateContent was called with the correct path
    expect(gitlabApi.fetchTemplateContent).toHaveBeenCalledWith(
      "api-reference/template_api-reference.md"
    )

    // Verify preview is displayed
    await waitFor(() => {
      expect(screen.getByText("# API Reference Template")).toBeInTheDocument()
    })
  })

  it("inserts template content and closes modal when Insert Template is clicked", async () => {
    // Mock successful API responses
    ;(gitlabApi.fetchTemplateFiles as jest.Mock)
      .mockResolvedValueOnce(mockTemplates)(
        gitlabApi.fetchTemplateContent as jest.Mock
      )
      .mockResolvedValueOnce(mockTemplateContent)

    render(<TemplateModal {...mockProps} />)

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
    await userEvent.click(screen.getByTestId("insert-button"))

    // Verify onSelectTemplate and onClose were called
    expect(mockProps.onSelectTemplate).toHaveBeenCalledWith(mockTemplateContent)
    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it("filters templates based on search query", async () => {
    // Mock successful API response
    ;(gitlabApi.fetchTemplateFiles as jest.Mock).mockResolvedValueOnce(
      mockTemplates
    )

    render(<TemplateModal {...mockProps} />)

    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText("Api Reference")).toBeInTheDocument()
      expect(screen.getByText("How To")).toBeInTheDocument()
    })

    // Type in search box
    await userEvent.type(
      screen.getByPlaceholderText("Search templates..."),
      "api"
    )

    // Only "Api Reference" should be visible
    expect(screen.getByText("Api Reference")).toBeInTheDocument()
    expect(screen.queryByText("How To")).not.toBeInTheDocument()
  })

  it("closes the modal when Cancel button is clicked", async () => {
    // Mock successful API response
    ;(gitlabApi.fetchTemplateFiles as jest.Mock).mockResolvedValueOnce(
      mockTemplates
    )

    render(<TemplateModal {...mockProps} />)

    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText("Api Reference")).toBeInTheDocument()
    })

    // Click Cancel button
    await userEvent.click(screen.getByTestId("cancel-button"))

    // Verify onClose was called
    expect(mockProps.onClose).toHaveBeenCalled()
  })
})
