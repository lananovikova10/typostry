/**
 * API client for LanguageTool grammar checking
 */
import { isInDictionary } from "./dictionary"
import { mapStrippedToOriginal } from "./preprocessor"
import {
  GrammarError,
  LanguageToolRequest,
  LanguageToolResponse,
  PositionMapping,
} from "./types"

// Default API endpoint
const DEFAULT_API_URL = "https://api.languagetool.org/v2/check"
const FALLBACK_API_URL = "https://languagetool.org/api/v2/check"
const DEFAULT_LANGUAGE = "en-US"

// Rate limiting configuration (to stay within LanguageTool API limits)
// 20 requests per minute, 75KB per minute, 20KB per request
const MAX_TEXT_LENGTH = 10000 // 10KB per request to be safe
const MIN_REQUEST_INTERVAL = 5000 // Minimum 5 seconds between requests
let lastRequestTime = 0

// Request queue for managing API calls
interface QueuedRequest {
  text: string
  mapping: PositionMapping
  options: GrammarCheckOptions
  resolve: (value: GrammarError[]) => void
  reject: (error: Error) => void
  timestamp: number
}

interface GrammarCheckOptions {
  language?: string
  apiUrl?: string
  disabledRules?: string[]
  onTextTruncated?: (originalLength: number, truncatedLength: number) => void
}

// Paragraph-level cache for results
interface CacheEntry {
  result: GrammarError[]
  timestamp: number
  paragraph: string
}

class GrammarCheckManager {
  private requestQueue: QueuedRequest[] = []
  private processing = false
  private cache = new Map<string, CacheEntry>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  // Generate cache key for paragraph
  private getCacheKey(text: string, language: string): string {
    return `${language}:${text.trim().substring(0, 100)}`
  }

  // Split text into paragraphs for caching
  private splitIntoParagraphs(text: string): string[] {
    return text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
  }

  // Get cached result if available
  private getCachedResult(text: string, language: string): GrammarError[] | null {
    const key = this.getCacheKey(text, language)
    const entry = this.cache.get(key)

    if (entry && Date.now() - entry.timestamp < this.CACHE_TTL) {
      return entry.result
    }

    // Remove expired entry
    if (entry) {
      this.cache.delete(key)
    }

    return null
  }

  // Cache result for paragraph
  private setCachedResult(text: string, language: string, result: GrammarError[]): void {
    const key = this.getCacheKey(text, language)
    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      paragraph: text
    })
  }

  // Add request to queue
  async queueRequest(
    text: string,
    mapping: PositionMapping,
    options: GrammarCheckOptions = {}
  ): Promise<GrammarError[]> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        text,
        mapping,
        options,
        resolve,
        reject,
        timestamp: Date.now()
      })

      this.processQueue()
    })
  }

  // Process request queue
  private async processQueue(): Promise<void> {
    if (this.processing || this.requestQueue.length === 0) {
      return
    }

    this.processing = true

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!

      try {
        const result = await this.performGrammarCheck(
          request.text,
          request.mapping,
          request.options
        )
        request.resolve(result)
      } catch (error) {
        request.reject(error as Error)
      }
    }

    this.processing = false
  }

  // Perform grammar check with caching
  private async performGrammarCheck(
    text: string,
    mapping: PositionMapping,
    options: GrammarCheckOptions
  ): Promise<GrammarError[]> {
    const { language = DEFAULT_LANGUAGE } = options

    // Check cache first for the entire text
    const cachedResult = this.getCachedResult(text, language)
    if (cachedResult) {
      return cachedResult
    }

    // For large texts, try paragraph-level caching
    const paragraphs = this.splitIntoParagraphs(text)
    if (paragraphs.length > 1) {
      const allErrors: GrammarError[] = []
      let textOffset = 0

      for (const paragraph of paragraphs) {
        const paragraphCached = this.getCachedResult(paragraph, language)

        if (paragraphCached) {
          // Adjust offsets for cached results
          const adjustedErrors = paragraphCached.map(error => ({
            ...error,
            offset: error.offset + textOffset,
            originalOffset: error.originalOffset + textOffset
          }))
          allErrors.push(...adjustedErrors)
        } else {
          // Process paragraph individually
          const paragraphResult = await this.checkGrammarDirect(paragraph, mapping, options)

          // Cache paragraph result
          this.setCachedResult(paragraph, language, paragraphResult)

          // Adjust offsets and add to results
          const adjustedErrors = paragraphResult.map(error => ({
            ...error,
            offset: error.offset + textOffset,
            originalOffset: error.originalOffset + textOffset
          }))
          allErrors.push(...adjustedErrors)
        }

        textOffset += paragraph.length + 2 // +2 for the paragraph separator
      }

      return allErrors
    }

    // For single paragraph or short text, check directly
    const result = await this.checkGrammarDirect(text, mapping, options)
    this.setCachedResult(text, language, result)
    return result
  }

  // Direct grammar check (original implementation)
  private async checkGrammarDirect(
    text: string,
    mapping: PositionMapping,
    options: GrammarCheckOptions
  ): Promise<GrammarError[]> {
    const {
      language = DEFAULT_LANGUAGE,
      apiUrl = DEFAULT_API_URL,
      disabledRules = [],
      onTextTruncated
    } = options

    // If text is empty, return empty array
    if (!text.trim()) {
      return []
    }

    // Apply rate limiting
    const now = Date.now()
    const timeSinceLastRequest = now - lastRequestTime
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise((resolve) =>
        setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      )
    }
    lastRequestTime = Date.now()

    // Limit text length and notify user if truncated
    const originalLength = text.length
    const limitedText = text.length > MAX_TEXT_LENGTH ? text.substring(0, MAX_TEXT_LENGTH) : text

    if (text.length > MAX_TEXT_LENGTH) {
      console.warn(
        `Text truncated from ${originalLength} to ${MAX_TEXT_LENGTH} characters to comply with API limits`
      )

      // Notify user through callback
      onTextTruncated?.(originalLength, MAX_TEXT_LENGTH)
    }

    // Rest of the original implementation...
    const requestBody: LanguageToolRequest = {
      text: limitedText,
      language: language, // Use the specified language instead of "auto"
      disabledRules: disabledRules.length > 0 ? disabledRules.join(",") : undefined,
      motherTongue: "en",
      preferredVariants: language,
      clientId: "typostry",
      level: "default",
    }

    try {
      console.log(`Sending grammar check request (${limitedText.length} chars)...`)

      let response
      try {
        response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: new URLSearchParams(requestBody as any).toString(),
        })
      } catch (primaryError) {
        console.error("Primary API endpoint failed:", primaryError)
        console.log("Trying fallback API endpoint...")

        response = await fetch(FALLBACK_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: new URLSearchParams(requestBody as any).toString(),
        })
      }

      console.log(`API Response Status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        try {
          const errorData = await response.text()
          console.error(`LanguageTool API error (${response.status}): ${errorData}`)
        } catch {
          console.error(`LanguageTool API error: ${response.status} ${response.statusText}`)
        }

        if (response.status === 429 || response.status === 400) {
          console.warn("Rate limit likely exceeded. Waiting longer before next request.")
          lastRequestTime = Date.now() + 30000
        }

        throw new Error(`LanguageTool API error: ${response.status} ${response.statusText}`)
      }

      const data: LanguageToolResponse = await response.json()

      if (!data.matches || data.matches.length === 0) {
        console.log("No grammar errors found in the text")
      } else {
        console.log(`Found ${data.matches.length} grammar errors`)
      }

      const results = processGrammarResults(data, mapping)
      console.log(`Processed ${results.length} grammar results`)
      return results
    } catch (error) {
      console.error("Grammar check failed:", error)
      return []
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear()
  }

  // Get cache stats
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    }
  }
}

// Global instance
const grammarCheckManager = new GrammarCheckManager()

/**
 * Public API for grammar checking with queuing and caching
 */
export async function checkGrammar(
  text: string,
  mapping: PositionMapping,
  options: {
    language?: string
    apiUrl?: string
    disabledRules?: string[]
    onTextTruncated?: (originalLength: number, truncatedLength: number) => void
  } = {}
): Promise<GrammarError[]> {
  return grammarCheckManager.queueRequest(text, mapping, options)
}

/**
 * Manual grammar check function (for button-triggered checks)
 */
export async function checkGrammarManual(
  text: string,
  mapping: PositionMapping,
  options: {
    language?: string
    apiUrl?: string
    disabledRules?: string[]
    onTextTruncated?: (originalLength: number, truncatedLength: number) => void
  } = {}
): Promise<GrammarError[]> {
  // Clear any queued automatic requests and process this manually triggered one immediately
  return grammarCheckManager.queueRequest(text, mapping, options)
}

/**
 * Clear grammar check cache
 */
export function clearGrammarCache(): void {
  grammarCheckManager.clearCache()
}

/**
 * Get cache statistics
 */
export function getGrammarCacheStats(): { size: number; entries: string[] } {
  return grammarCheckManager.getCacheStats()
}

/**
 * Process LanguageTool API response into our internal format
 */
function processGrammarResults(
  response: LanguageToolResponse,
  mapping: PositionMapping
): GrammarError[] {
  const errors: GrammarError[] = []

  // Define the placeholder character used for images
  const IMAGE_PLACEHOLDER = "⁂"

  for (const match of response.matches) {
    // Skip errors for words in custom dictionary
    if (
      isInDictionary(
        match.context.text.substring(
          match.context.offset,
          match.context.offset + match.context.length
        ),
        match.rule.id
      )
    ) {
      continue
    }

    // Skip errors that involve our image placeholder character
    const errorText = match.context.text.substring(
      match.context.offset,
      match.context.offset + match.context.length
    )
    if (errorText.includes(IMAGE_PLACEHOLDER)) {
      continue
    }

    // Map error position from stripped text back to original markdown
    const originalOffset = mapStrippedToOriginal(match.offset, mapping)
    const endOffset = mapStrippedToOriginal(
      match.offset + match.length,
      mapping
    )
    const originalLength = endOffset - originalOffset

    // Determine error type
    const type =
      match.rule.issueType === "misspelling" ||
      match.rule.category?.id === "TYPOS" ||
      match.rule.id.includes("SPELL")
        ? "spelling"
        : "grammar"

    // Determine error severity based on rule properties
    let severity: "low" | "medium" | "high" = "medium" // Default to medium

    // Rules for determining severity
    if (type === "spelling") {
      // Spelling errors are generally high severity
      severity = "high"
    } else if (
      match.rule.id.includes("STYLE") ||
      match.rule.category?.id === "STYLE"
    ) {
      // Style issues are low severity
      severity = "low"
    } else if (
      match.rule.id.includes("PUNCTUATION") ||
      match.rule.category?.id === "PUNCTUATION"
    ) {
      // Punctuation issues are medium severity
      severity = "medium"
    } else if (
      match.rule.id.includes("GRAMMAR") ||
      match.rule.category?.id === "GRAMMAR"
    ) {
      // Grammar issues are high severity
      severity = "high"
    }

    errors.push({
      message: match.message,
      shortMessage: match.shortMessage,
      offset: match.offset,
      length: match.length,
      rule: {
        id: match.rule.id,
        description: match.rule.description,
        category: match.rule.category,
      },
      replacements: match.replacements,
      type,
      severity,
      originalOffset,
      originalLength,
      context: match.context,
    })
  }

  return errors
}
