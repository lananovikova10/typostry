/**
 * Hugging Face Inference API integration for text summarization
 * Uses facebook/bart-large-cnn for summarization (state-of-the-art summarization model)
 */

const HF_SUMMARIZATION_URL = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn"

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
    // Calculate appropriate max_length based on input text length
    const inputWordCount = text.split(/\s+/).length
    const maxLength = Math.min(options?.maxLength || Math.floor(inputWordCount / 3), 130)
    const minLength = Math.max(options?.minLength || 30, 20)

    const response = await fetch(HF_SUMMARIZATION_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          max_length: maxLength,
          min_length: minLength,
          do_sample: false,
          num_beams: 4,
          length_penalty: 2.0,
          early_stopping: true,
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

    // Handle array response with generated_text (T5 models)
    if (Array.isArray(data) && data.length > 0) {
      // Check for translation_text field (T5 models sometimes use this)
      if (data[0].translation_text) {
        let result = data[0].translation_text.trim()
        // Remove the "summarize: " prefix if it's in the output
        if (result.startsWith('summarize: ')) {
          result = result.substring('summarize: '.length).trim()
        }
        return result
      }
      if (data[0].generated_text) {
        return data[0].generated_text.trim()
      }
      if (data[0].summary_text) {
        return data[0].summary_text.trim()
      }
      if (typeof data[0] === 'string') {
        return data[0].trim()
      }
    }

    // Handle single object response
    if (data.translation_text) {
      let result = data.translation_text.trim()
      if (result.startsWith('summarize: ')) {
        result = result.substring('summarize: '.length).trim()
      }
      return result
    }

    if (data.generated_text) {
      return data.generated_text.trim()
    }

    if (data.summary_text) {
      return data.summary_text.trim()
    }

    // Handle direct string response
    if (typeof data === 'string') {
      return data.trim()
    }

    throw new Error("Unexpected response format from Hugging Face API")
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to summarize text: ${error.message}`)
    }
    throw new Error("Failed to summarize text: Unknown error")
  }
}
