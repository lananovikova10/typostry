import { NextRequest } from "next/server"

import { summarizeRequestSchema } from "@/lib/api-schemas"
import {
  noStoreJson,
  requireRateLimit,
  requireTrustedRequest,
} from "@/lib/api-security"
import { summarizeText } from "@/lib/huggingface"

export async function POST(request: NextRequest) {
  const trustedRequestError = requireTrustedRequest(request)
  if (trustedRequestError) {
    return trustedRequestError
  }

  const rateLimitError = requireRateLimit(request, {
    key: "summarize",
    maxRequests: 10,
    windowMs: 60 * 1000,
    errorMessage: "Too many summarization requests. Please wait before retrying.",
  })
  if (rateLimitError) {
    return rateLimitError
  }

  try {
    const body = await request.json()
    const parsedBody = summarizeRequestSchema.safeParse(body)

    if (!parsedBody.success) {
      return noStoreJson(
        {
          error: "Invalid summarization request",
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      )
    }

    const summary = await summarizeText(
      parsedBody.data.text,
      parsedBody.data.options
    )

    return noStoreJson({ summary })
  } catch (error) {
    console.error("Summarization route error:", error)
    return noStoreJson(
      {
        error: "Failed to summarize text",
      },
      { status: 500 }
    )
  }
}
