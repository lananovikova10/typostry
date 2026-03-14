import {
  nlcCompletionRequestSchema,
  summarizeRequestSchema,
  unsplashRandomParamsSchema,
  uploadFileMetadataSchema,
} from "@/lib/api-schemas"

describe("api schemas", () => {
  it("rejects unsupported upload types", () => {
    const result = uploadFileMetadataSchema.safeParse({
      name: "payload.svg",
      size: 1024,
      type: "image/svg+xml",
    })

    expect(result.success).toBe(false)
  })

  it("rejects oversized completion contexts", () => {
    const result = nlcCompletionRequestSchema.safeParse({
      context: "a".repeat(4001),
      language: "en",
    })

    expect(result.success).toBe(false)
  })

  it("rejects unsplash parameters outside the allowlist", () => {
    const result = unsplashRandomParamsSchema.safeParse({
      query: "mountains",
      client_id: "leak-me",
    })

    expect(result.success).toBe(false)
  })

  it("accepts bounded summarization requests", () => {
    const result = summarizeRequestSchema.safeParse({
      text: "Summarize this text",
      options: {
        maxLength: 80,
        minLength: 20,
      },
    })

    expect(result.success).toBe(true)
  })
})
