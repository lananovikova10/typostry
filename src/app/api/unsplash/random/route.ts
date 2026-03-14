import { NextRequest } from "next/server"

import { unsplashRandomParamsSchema } from "@/lib/api-schemas"
import {
  noStoreJson,
  requireRateLimit,
  requireTrustedRequest,
} from "@/lib/api-security"
import { getRandomPhoto } from "@/lib/unsplash/api"

export async function GET(request: NextRequest) {
  const trustedRequestError = requireTrustedRequest(request)
  if (trustedRequestError) {
    return trustedRequestError
  }

  const rateLimitError = requireRateLimit(request, {
    key: "unsplash-random",
    maxRequests: 30,
    windowMs: 60 * 1000,
    errorMessage: "Too many image requests. Please wait before trying again.",
  })
  if (rateLimitError) {
    return rateLimitError
  }

  try {
    const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries())
    const parsedParams = unsplashRandomParamsSchema.safeParse(rawParams)

    if (!parsedParams.success) {
      return noStoreJson(
        {
          error: "Invalid Unsplash request parameters",
          details: parsedParams.error.flatten(),
        },
        { status: 400 }
      )
    }

    const photo = await getRandomPhoto(parsedParams.data)
    return noStoreJson(photo)
  } catch (error) {
    console.error("Error fetching random photo from Unsplash:", error)
    return noStoreJson(
      {
        error: "Failed to fetch random photo from Unsplash",
      },
      { status: 500 }
    )
  }
}
