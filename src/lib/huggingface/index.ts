/**
 * Hugging Face Inference API integration for text summarization and paraphrasing
 * Uses facebook/bart-large-cnn for summarization (state-of-the-art summarization model)
 * Uses sshleifer/distilbart-cnn-12-6 for paraphrasing (using summarization with longer output)
 */

const HF_SUMMARIZATION_URL = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn"
const HF_PARAPHRASE_URL = "https://router.huggingface.co/hf-inference/models/sshleifer/distilbart-cnn-12-6"

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

export interface ParaphraseOptions {
  maxLength?: number
  numReturnSequences?: number
}

export interface ParaphraseResponse {
  generated_text: string
}

/**
 * Rephrase/paraphrase text using Hugging Face Inference API
 *
 * @param text - The text to rephrase
 * @param options - Optional paraphrasing parameters
 * @returns The rephrased text
 * @throws Error if the API request fails or API key is missing
 */
export async function rephraseText(
  text: string,
  options?: ParaphraseOptions
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_HF_API_KEY || process.env.HF_API_KEY

  if (!apiKey) {
    throw new Error("HF_API_KEY is not configured")
  }

  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty")
  }

  // Retry logic for model loading
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use BART summarization with parameters that produce a "rephrase" (longer output, more detail retention)
      const inputWordCount = text.split(/\s+/).length
      const maxLength = Math.max(options?.maxLength || Math.floor(inputWordCount * 1.2), inputWordCount)
      const minLength = Math.max(Math.floor(inputWordCount * 0.8), 30)

      const response = await fetch(HF_PARAPHRASE_URL, {
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
            do_sample: true,
            temperature: 0.9,
            top_p: 0.95,
            num_beams: 4,
            length_penalty: 1.0,
            early_stopping: true,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()

        // Check if model is loading
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error && errorData.error.includes("loading")) {
            const estimatedTime = errorData.estimated_time || 20
            if (attempt < maxRetries) {
              // Wait for the estimated time before retrying
              await new Promise(resolve => setTimeout(resolve, estimatedTime * 1000))
              continue
            }
            throw new Error(
              `Model is loading. Please try again in ${estimatedTime} seconds.`
            )
          }
        } catch (parseError) {
          // If not JSON or doesn't contain loading info, throw original error
        }

        throw new Error(
          `Hugging Face API error (${response.status}): ${errorText}`
        )
      }

      const data = await response.json()

      console.log("Rephrase API Response:", JSON.stringify(data, null, 2))

      // Handle array response with generated_text (T5 and BART models)
      if (Array.isArray(data) && data.length > 0) {
        // Check for translation_text field (T5 models sometimes use this)
        if (data[0].translation_text) {
          // T5 sometimes includes the prompt in the output, strip it
          let result = data[0].translation_text.trim()
          // Remove the "paraphrase: " prefix if it's in the output
          if (result.startsWith('paraphrase: ')) {
            result = result.substring('paraphrase: '.length).trim()
          }
          return result
        }
        // Check for generated_text field
        if (data[0].generated_text) {
          return data[0].generated_text.trim()
        }
        // Check for summary_text field
        if (data[0].summary_text) {
          return data[0].summary_text.trim()
        }
        // Check for generated_sequence field (some BART models use this)
        if (data[0].generated_sequence) {
          return data[0].generated_sequence.trim()
        }
        // Check for sequence field
        if (data[0].sequence) {
          return data[0].sequence.trim()
        }
        // Some models return just the text as a string
        if (typeof data[0] === 'string') {
          return data[0].trim()
        }
      }

      // Handle single object response
      if (data.translation_text) {
        let result = data.translation_text.trim()
        if (result.startsWith('paraphrase: ')) {
          result = result.substring('paraphrase: '.length).trim()
        }
        return result
      }

      if (data.generated_text) {
        return data.generated_text.trim()
      }

      if (data.summary_text) {
        return data.summary_text.trim()
      }

      if (data.generated_sequence) {
        return data.generated_sequence.trim()
      }

      if (data.sequence) {
        return data.sequence.trim()
      }

      // Handle direct string response
      if (typeof data === 'string') {
        return data.trim()
      }

      console.error("Unexpected response structure:", data)
      throw new Error(`Unexpected response format from Hugging Face API. Response: ${JSON.stringify(data)}`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error")
      if (attempt === maxRetries) {
        break
      }
      // Wait 2 seconds before retrying on other errors
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  if (lastError) {
    throw new Error(`Failed to rephrase text: ${lastError.message}`)
  }
  throw new Error("Failed to rephrase text: Unknown error")
}
