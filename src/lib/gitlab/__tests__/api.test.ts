import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  fetchTemplateContent,
  fetchTemplateFiles,
  formatTemplateName,
  getTemplatePreview,
} from "../api"

// Mock fetch
global.fetch = vi.fn()

describe("GitLab API Service", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe("formatTemplateName", () => {
    it("transforms template filenames correctly", () => {
      expect(formatTemplateName("template_api-reference.md")).toBe(
        "Api Reference"
      )
      expect(formatTemplateName("template_how-to.md")).toBe("How To")
      expect(formatTemplateName("template_tutorial.md")).toBe("Tutorial")
    })
  })

  describe("getTemplatePreview", () => {
    it("returns the first few lines of content", () => {
      const content = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5"
      expect(getTemplatePreview(content, 3)).toBe("Line 1\nLine 2\nLine 3")
    })
  })

  describe("fetchTemplateFiles", () => {
    it("fetches and filters template files using the correct URL", async () => {
      const mockResponse = [
        {
          id: "1",
          name: "template_api-reference.md",
          type: "blob",
          path: "api-reference/template_api-reference.md",
          mode: "100644",
        },
        {
          id: "2",
          name: "template_how-to.md",
          type: "blob",
          path: "how-to/template_how-to.md",
          mode: "100644",
        },
        {
          id: "3",
          name: "README.md",
          type: "blob",
          path: "README.md",
          mode: "100644",
        }, // Should be filtered out
        {
          id: "4",
          name: "assets",
          type: "tree",
          path: "assets",
          mode: "040000",
        }, // Should be filtered out
      ]

      // @ts-ignore
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const result = await fetchTemplateFiles()

      // Verify exact URL is used
      expect(fetch).toHaveBeenCalledWith(
        "https://gitlab.com/api/v4/projects/tgdp%2Ftemplates/repository/tree?ref=v1.3.0&recursive=true",
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      )
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe("template_api-reference.md")
      expect(result[1].name).toBe("template_how-to.md")
    })

    it("handles API errors", async () => {
      // @ts-ignore
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      })

      await expect(fetchTemplateFiles()).rejects.toThrow(
        "Failed to fetch templates: Internal Server Error"
      )
    })
  })

  describe("fetchTemplateContent", () => {
    it("fetches template content by path", async () => {
      const mockContent = "# API Reference Template\n\nSample content here"

      // @ts-ignore
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockContent),
      })

      const result = await fetchTemplateContent(
        "api-reference/template_api-reference.md"
      )

      expect(fetch).toHaveBeenCalledWith(
        "https://gitlab.com/api/v4/projects/tgdp%2Ftemplates/repository/files/api-reference%2Ftemplate_api-reference.md/raw?ref=v1.3.0",
        {
          headers: {
            Accept: "text/plain",
          },
        }
      )
      expect(result).toBe(mockContent)
    })

    it("handles content fetch errors", async () => {
      // @ts-ignore
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      })

      await expect(fetchTemplateContent("nonexistent/file.md")).rejects.toThrow(
        "Failed to fetch template content: Not Found"
      )
    })
  })
})
