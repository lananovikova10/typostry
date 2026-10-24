import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { fetchTemplateContent, fetchTemplateFiles } from "@/lib/gitlab"

import { TemplateSelector } from "../template-selector"

// Mock the GitLab API functions used by the selector
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
  getTemplatePreview: (content: string, lines = 3) => {
    return content.split("\n").slice(0, lines).join("\n")
  },
}))

const mockFetchTemplateFiles = fetchTemplateFiles as jest.MockedFunction<
  typeof fetchTemplateFiles
>
const mockFetchTemplateContent = fetchTemplateContent as jest.MockedFunction<
  typeof fetchTemplateContent
>

describe("TemplateSelector", () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSelectTemplate: jest.fn(),
  }

  const mockTemplates = [
    {
      id: "2",
      name: "template_how-to.md",
      type: "blob" as const,
      path: "how-to/template_how-to.md",
    },
    {
      id: "1",
      name: "template_api-reference.md",
      type: "blob" as const,
      path: "api-reference/template_api-reference.md",
    },
  ]

  const mockContent = "# API Reference Template\n\nSample content here"

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it("displays loading state initially", async () => {
    // Keep the request pending so the loading state stays visible
    mockFetchTemplateFiles.mockImplementation(() => new Promise(() => {}))

    render(<TemplateSelector {...mockProps} />)

    expect(screen.getByText("Loading templates...")).toBeInTheDocument()
    expect(mockFetchTemplateFiles).toHaveBeenCalledTimes(1)
  })

  it("displays templates sorted by name after successful fetch", async () => {
    mockFetchTemplateFiles.mockResolvedValueOnce(mockTemplates)

    render(<TemplateSelector {...mockProps} />)

    await waitFor(() => {
      expect(screen.queryByText("Loading templates...")).not.toBeInTheDocument()
    })

    const options = screen.getAllByRole("option")
    expect(options).toHaveLength(2)
    expect(options[0]).toHaveTextContent("Api Reference")
    expect(options[1]).toHaveTextContent("How To")
  })

  it("displays error message when fetch fails", async () => {
    mockFetchTemplateFiles.mockRejectedValueOnce(
      new Error("Failed to fetch templates: Internal Server Error")
    )

    render(<TemplateSelector {...mockProps} />)

    await waitFor(() => {
      expect(
        screen.getByText("Failed to fetch templates: Internal Server Error")
      ).toBeInTheDocument()
    })

    expect(screen.getByText("Try again")).toBeInTheDocument()
  })

  it("displays empty state when no templates are available", async () => {
    mockFetchTemplateFiles.mockResolvedValueOnce([])

    render(<TemplateSelector {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText("No templates available")).toBeInTheDocument()
    })
  })

  it("fetches template content when a template is selected", async () => {
    mockFetchTemplateFiles.mockResolvedValueOnce(mockTemplates)
    mockFetchTemplateContent.mockResolvedValueOnce(mockContent)

    render(<TemplateSelector {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText("Api Reference")).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText("Api Reference"))

    expect(mockFetchTemplateContent).toHaveBeenCalledWith(
      "api-reference/template_api-reference.md"
    )

    // Preview is rendered in a <pre>, so match on its full text content
    await waitFor(() => {
      expect(
        screen.getByText((_, element) => {
          return (
            element?.tagName === "PRE" &&
            element.textContent === mockContent
          )
        })
      ).toBeInTheDocument()
    })
  })

  it("closes the modal and calls onSelectTemplate when Insert Template button is clicked", async () => {
    mockFetchTemplateFiles.mockResolvedValueOnce(mockTemplates)
    mockFetchTemplateContent.mockResolvedValueOnce(mockContent)

    render(<TemplateSelector {...mockProps} />)

    await waitFor(() => {
      expect(screen.getByText("Api Reference")).toBeInTheDocument()
    })

    const insertButton = screen.getByRole("button", { name: "Insert Template" })
    expect(insertButton).toBeDisabled()

    await userEvent.click(screen.getByText("Api Reference"))

    await waitFor(() => {
      expect(insertButton).toBeEnabled()
    })

    await userEvent.click(insertButton)

    expect(mockProps.onSelectTemplate).toHaveBeenCalledWith(mockContent)
    expect(mockProps.onClose).toHaveBeenCalled()
  })
})
