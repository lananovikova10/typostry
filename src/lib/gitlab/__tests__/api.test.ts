type GitLabApi = typeof import("../api")

const TREE_URL =
  "https://gitlab.com/api/v4/projects/tgdp%2Ftemplates/repository/tree?ref=v1.3.0&recursive=true&per_page=100"

// Minimal Response-like object; `nextPage` drives the x-next-page header
const jsonResponse = (body: unknown, nextPage: string | null = null) => ({
  ok: true,
  json: () => Promise.resolve(body),
  headers: {
    get: (name: string) =>
      name.toLowerCase() === "x-next-page" ? nextPage : null,
  },
})

describe("GitLab API Service", () => {
  let api: GitLabApi
  let fetchMock: jest.Mock

  beforeEach(() => {
    // The API module keeps an in-memory cache, so load a fresh copy per test
    jest.resetModules()
    fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch
    jest.spyOn(console, "error").mockImplementation(() => {})
    api = require("../api")
  })

  afterEach(() => {
    jest.dontMock("../../rate-limiter")
    jest.restoreAllMocks()
  })

  describe("formatTemplateName", () => {
    it("transforms template filenames correctly", () => {
      expect(api.formatTemplateName("template_api-reference.md")).toBe(
        "Api Reference"
      )
      expect(api.formatTemplateName("template_how-to.md")).toBe("How To")
      expect(api.formatTemplateName("template_tutorial.md")).toBe("Tutorial")
    })
  })

  describe("getTemplatePreview", () => {
    it("returns the first few lines of content", () => {
      const content = "Line 1\nLine 2\nLine 3\nLine 4\nLine 5"
      expect(api.getTemplatePreview(content, 3)).toBe("Line 1\nLine 2\nLine 3")
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

      fetchMock.mockResolvedValueOnce(jsonResponse(mockResponse))

      const result = await api.fetchTemplateFiles()

      // Single page: stops when x-next-page is empty
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock).toHaveBeenCalledWith(`${TREE_URL}&page=1`, {
        headers: {
          Accept: "application/json",
        },
      })
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe("template_api-reference.md")
      expect(result[1].name).toBe("template_how-to.md")
    })

    it("follows the x-next-page header across pages", async () => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse(
            [
              {
                id: "1",
                name: "template_api-reference.md",
                type: "blob",
                path: "api-reference/template_api-reference.md",
              },
            ],
            "2"
          )
        )
        .mockResolvedValueOnce(
          jsonResponse(
            [
              {
                id: "2",
                name: "template_how-to.md",
                type: "blob",
                path: "how-to/template_how-to.md",
              },
            ],
            ""
          )
        )

      const result = await api.fetchTemplateFiles()

      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(fetchMock.mock.calls[0][0]).toBe(`${TREE_URL}&page=1`)
      expect(fetchMock.mock.calls[1][0]).toBe(`${TREE_URL}&page=2`)
      expect(result.map((t) => t.name)).toEqual([
        "template_api-reference.md",
        "template_how-to.md",
      ])
    })

    it("stops after the maximum number of pages", async () => {
      // Bypass the module's 10 req/min rate limiter so only the page cap applies
      jest.resetModules()
      jest.doMock("../../rate-limiter", () => ({
        RateLimiter: jest.fn().mockImplementation(() => ({
          execute: (fn: () => Promise<unknown>) => fn(),
        })),
      }))
      api = require("../api")

      let page = 1
      fetchMock.mockImplementation(() =>
        Promise.resolve(jsonResponse([], String(++page)))
      )

      await api.fetchTemplateFiles()

      expect(fetchMock).toHaveBeenCalledTimes(20)
    })

    it("returns cached results on subsequent calls", async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse([
          {
            id: "1",
            name: "template_api-reference.md",
            type: "blob",
            path: "api-reference/template_api-reference.md",
          },
        ])
      )

      const first = await api.fetchTemplateFiles()
      const second = await api.fetchTemplateFiles()

      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(second).toEqual(first)
    })

    it("handles API errors", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        headers: { get: () => null },
      })

      await expect(api.fetchTemplateFiles()).rejects.toThrow(
        "Failed to fetch templates: Internal Server Error"
      )
    })
  })

  describe("fetchTemplateContent", () => {
    it("fetches template content by path", async () => {
      const mockContent = "# API Reference Template\n\nSample content here"

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockContent),
        headers: { get: () => null },
      })

      const result = await api.fetchTemplateContent(
        "api-reference/template_api-reference.md"
      )

      expect(fetchMock).toHaveBeenCalledWith(
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
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        headers: { get: () => null },
      })

      await expect(
        api.fetchTemplateContent("nonexistent/file.md")
      ).rejects.toThrow("Failed to fetch template content: Not Found")
    })
  })
})
