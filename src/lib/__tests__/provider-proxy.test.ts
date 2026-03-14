import { summarizeText } from "@/lib/huggingface"
import { getRandomPhoto } from "@/lib/unsplash/api"

jest.mock("@/env.mjs", () => ({
  env: {
    UNSPLASH_ACCESS_KEY: undefined,
  },
}))

describe("provider proxy helpers", () => {
  beforeEach(() => {
    jest.resetAllMocks()
    global.fetch = jest.fn()
  })

  it("routes Unsplash browser requests through the internal API", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: "photo-1" }),
    })

    await getRandomPhoto({ query: "forest" })

    expect(global.fetch).toHaveBeenCalledWith(
      `${window.location.origin}/api/unsplash/random?query=forest`,
      expect.objectContaining({
        method: "GET",
        credentials: "same-origin",
      })
    )
  })

  it("routes summarization browser requests through the internal API", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ summary: "Short summary" }),
    })

    await summarizeText("Long text")

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/summarize",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
      })
    )
  })
})
