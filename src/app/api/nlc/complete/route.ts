import { NextRequest } from "next/server"

import { nlcCompletionRequestSchema } from "@/lib/api-schemas"
import {
  noStoreJson,
  requireRateLimit,
  requireTrustedRequest,
} from "@/lib/api-security"

export async function POST(request: NextRequest) {
  const trustedRequestError = requireTrustedRequest(request)
  if (trustedRequestError) {
    return trustedRequestError
  }

  const rateLimitError = requireRateLimit(request, {
    key: "nlc-complete",
    maxRequests: 20,
    windowMs: 60 * 1000,
    errorMessage:
      "Too many completion requests. Please wait before trying again.",
  })
  if (rateLimitError) {
    return rateLimitError
  }

  try {
    const body = await request.json()
    const parsedBody = nlcCompletionRequestSchema.safeParse(body)

    if (!parsedBody.success) {
      return noStoreJson(
        {
          error: "Invalid completion request",
          details: parsedBody.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { context, language } = parsedBody.data
    const token = process.env.GRAZIE_TOKEN

    if (!token) {
      console.error("Missing GRAZIE_TOKEN environment variable")
      return noStoreJson(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const apiUrl = "https://api.jetbrains.ai/application/v5/trf/nlc/complete/v3"
    const requestBody = {
      context,
      lang: language,
    }

    const grazieResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "grazie-authenticate-jwt": token,
        "grazie-agent": JSON.stringify({ name: "typostry", version: "1.0.0" }),
      },
      body: JSON.stringify(requestBody),
    })

    if (!grazieResponse.ok) {
      const errorText = await grazieResponse.text()
      console.error("NLC provider error:", {
        status: grazieResponse.status,
        body: errorText,
      })

      if (grazieResponse.status === 401) {
        return noStoreJson(
          {
            error: "Authentication failed",
          },
          { status: 401 }
        )
      }

      return noStoreJson(
        {
          error: "Failed to generate completion",
        },
        { status: grazieResponse.status }
      )
    }

    const data = await grazieResponse.json()

    if (
      data.completions &&
      data.completions.prefix !== undefined &&
      Array.isArray(data.completions.options)
    ) {
      return noStoreJson({
        prefix: data.completions.prefix,
        completions: data.completions.options,
      })
    }

    console.error("Unexpected NLC response format:", data)
    return noStoreJson(
      { error: "Unexpected response format from completion service" },
      { status: 500 }
    )
  } catch (error) {
    console.error("NLC completion error:", error)
    return noStoreJson(
      {
        error: "Internal server error",
      },
      { status: 500 }
    )
  }
}
