/**
 * Hugging Face Inference API integration for text summarization
 * Uses facebook/bart-large-cnn model for high-quality summarization
 */

const HF_API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn"

export interface SummarizationOptions {
  maxLength?: number
  minLength?: number
  doSample?: boolean
}

export interface SummarizationResponse {
  summary_text: string
}

/**
 * Summarize text using Hugging Face Inference API
 *
 * @param text - The text to summarize
 * @param options - Optional summarization parameters
 * @returns The summarized text
 * @throws Error if the API request fails or API key is missing
 */
export async function summarizeText(
  text: string,
  options?: SummarizationOptions
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_HF_API_KEY || process.env.HF_API_KEY

  if (!apiKey) {
    throw new Error("HF_API_KEY is not configured")
  }

  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty")
  }

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          max_length: options?.maxLength || 130,
          min_length: options?.minLength || 30,
          do_sample: options?.doSample || false,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Hugging Face API error (${response.status}): ${errorText}`
      )
    }

    const data = await response.json()

    // Handle array response (typical for summarization models)
    if (Array.isArray(data) && data.length > 0) {
      return data[0].summary_text
    }

    // Handle single object response
    if (data.summary_text) {
      return data.summary_text
    }

    throw new Error("Unexpected response format from Hugging Face API")
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to summarize text: ${error.message}`)
    }
    throw new Error("Failed to summarize text: Unknown error")
  }
}
