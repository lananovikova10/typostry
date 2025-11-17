/**
 * Test script to debug the Hugging Face rephrase API
 * Run with: node test-rephrase.js
 */

// Try different models - including using summarization model differently
const models = [
  "facebook/bart-large-cnn",  // BART model - we'll use it differently
  "google/flan-t5-base", // Flan T5 - instruction-tuned, might work for paraphrasing
  "t5-base",  // Base T5 model
]

const HF_PARAPHRASE_URL = `https://router.huggingface.co/hf-inference/models/${models[0]}`
const apiKey = "REDACTED_HF_API_KEY"

async function testRephrase(text, modelUrl) {
  console.log("Testing model:", modelUrl)
  console.log("Testing rephrase with text:", text)
  console.log("---")

  const inputWordCount = text.split(/\s+/).length
  const maxLength = Math.min(Math.floor(inputWordCount * 1.3), 512)
  const minLength = Math.max(Math.floor(inputWordCount * 0.85), Math.min(inputWordCount - 3, 10))

  console.log("Input word count:", inputWordCount)
  console.log("Max length:", maxLength)
  console.log("Min length:", minLength)
  console.log("---")

  try {
    const response = await fetch(modelUrl, {
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
          temperature: 0.8,
          top_p: 0.9,
          num_beams: 3,
          length_penalty: 0.6,
          repetition_penalty: 1.3,
          early_stopping: true,
        },
      }),
    })

    console.log("Response status:", response.status)
    console.log("Response headers:", Object.fromEntries(response.headers.entries()))
    console.log("---")

    const data = await response.json()
    console.log("Response data:", JSON.stringify(data, null, 2))
    console.log("---")

    // Try to extract the rephrased text
    if (Array.isArray(data) && data.length > 0) {
      console.log("Array response detected")
      console.log("First element keys:", Object.keys(data[0]))

      if (data[0].summary_text) {
        console.log("✓ Found summary_text:", data[0].summary_text)
        return data[0].summary_text
      }
      if (data[0].generated_text) {
        console.log("✓ Found generated_text:", data[0].generated_text)
        return data[0].generated_text
      }
    }

    if (data.summary_text) {
      console.log("✓ Found summary_text:", data.summary_text)
      return data.summary_text
    }
    if (data.generated_text) {
      console.log("✓ Found generated_text:", data.generated_text)
      return data.generated_text
    }

    console.log("✗ No recognized field found in response")
    return null
  } catch (error) {
    console.error("Error:", error)
    throw error
  }
}

// Test with a sample text
const testText = "The quick brown fox jumps over the lazy dog. This is a simple test sentence."

// Test all models
async function testAllModels() {
  for (const model of models) {
    const modelUrl = `https://router.huggingface.co/hf-inference/models/${model}`
    console.log("\n" + "=".repeat(80))
    console.log(`Testing model: ${model}`)
    console.log("=".repeat(80) + "\n")

    try {
      const result = await testRephrase(testText, modelUrl)
      console.log("---")
      console.log("✓ SUCCESS!")
      console.log("Final result:", result)
      console.log("---")
      console.log("Is same as input?", result === testText)
      console.log("Is different?", result !== testText)
      break // Stop on first successful model
    } catch (err) {
      console.error("✗ FAILED:", err.message)
    }
  }
}

testAllModels()
