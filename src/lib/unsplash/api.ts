/**
 * Unsplash API integration
 */

import { env } from "@/env.mjs"

import {
  UnsplashPhoto,
  UnsplashRandomPhotoParams,
  UnsplashRandomPhotoResponse,
} from "./types"

// Unsplash API base URL
const UNSPLASH_API_URL = "https://api.unsplash.com"

// Get the API key from environment variables
// Use the client-side key for browser environments, fallback to server-side
const UNSPLASH_ACCESS_KEY =
  typeof window !== "undefined"
    ? env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY
    : env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY

/**
 * Fetches a random photo from Unsplash
 * @param params Optional parameters to filter the random photo selection
 * @returns A promise that resolves to a random photo or an array of photos
 */
export async function getRandomPhoto(
  params?: UnsplashRandomPhotoParams
): Promise<UnsplashPhoto | UnsplashPhoto[]> {
  if (!UNSPLASH_ACCESS_KEY) {
    throw new Error(
      "Unsplash API key is not configured. Please add UNSPLASH_ACCESS_KEY or NEXT_PUBLIC_UNSPLASH_ACCESS_KEY to your .env.local file."
    )
  }

  try {
    // Prepare URL with query parameters
    const url = new URL(`${UNSPLASH_API_URL}/photos/random`)

    // Add parameters to the URL if provided
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, value.toString())
        }
      })
    }

    // Make the API request
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        "Accept-Version": "v1",
      },
    })

    // Check if the request was successful
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Unsplash API error (${response.status}): ${errorText}`)
    }

    // Parse the response
    const data: UnsplashRandomPhotoResponse = await response.json()
    return data
  } catch (error) {
    console.error("Error fetching random photo from Unsplash:", error)
    throw error
  }
}

/**
 * Formats a random photo as markdown
 * @param photo The photo to format
 * @returns Markdown string for the photo
 */
export function formatPhotoAsMarkdown(photo: UnsplashPhoto): string {
  const altText = photo.description || `Photo by ${photo.user.name} on Unsplash`
  const imageUrl = photo.urls.regular
  const creditText = `Photo by [${photo.user.name}](${photo.user.links?.html || `https://unsplash.com/@${photo.user.username}`}) on [Unsplash](${photo.links.html})`

  return `![${altText}](${imageUrl})\n\n${creditText}`
}

/**
 * Gets a random photo and formats it as markdown
 * @param params Optional parameters to filter the random photo selection
 * @returns A promise that resolves to a markdown string
 */
export async function getRandomPhotoAsMarkdown(
  params?: UnsplashRandomPhotoParams
): Promise<string> {
  try {
    const photo = await getRandomPhoto(params)

    // Handle both single photo and array responses
    if (Array.isArray(photo)) {
      if (photo.length === 0) {
        throw new Error("No photos found matching the criteria")
      }
      return formatPhotoAsMarkdown(photo[0])
    }

    return formatPhotoAsMarkdown(photo)
  } catch (error) {
    console.error("Error getting random photo as markdown:", error)
    throw error
  }
}
