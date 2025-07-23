/**
 * Grazie API service implementation
 */

import {
  ConfidenceLevel,
  CorrectionServiceType,
  Language,
  Problem,
  ProblemCategory,
  SentenceWithProblems,
} from "@/types/grazie"

import { clientEnv } from "../env-client"
import { createGrazieClient, GrazieClient, GrazieError } from "../grazie-client"
import { isInDictionary } from "./dictionary"
import { mapStrippedToOriginal } from "./preprocessor"
import {
  GrammarServiceOptions,
  GrammarServiceProvider,
  IGrammarService,
} from "./service-interface"
import { GrammarError, PositionMapping } from "./types"

export class GrazieService implements IGrammarService {
  private client: GrazieClient | null
  private isConfigured: boolean

  constructor() {
    try {
      const token = clientEnv.getGrazieToken()
      if (token) {
        this.client = createGrazieClient({ token })
        this.isConfigured = true
      } else {
        this.isConfigured = false
        this.client = null
      }
    } catch (error) {
      console.warn("Grazie service not configured:", error)
      this.isConfigured = false
      this.client = null
    }
  }

  /**
   * Configure the Grazie service with a token
   */
  configure(token: string): void {
    try {
      clientEnv.setGrazieToken(token)
      this.client = createGrazieClient({ token })
      this.isConfigured = true
    } catch (error) {
      console.error("Failed to configure Grazie service:", error)
      this.isConfigured = false
      this.client = null
      throw error
    }
  }

  async checkGrammar(
    text: string,
    mapping: PositionMapping,
    options: GrammarServiceOptions = {}
  ): Promise<GrammarError[]> {
    if (!this.isAvailable()) {
      throw new Error("Grazie service is not available or configured")
    }

    if (!text.trim()) {
      return []
    }

    try {
      // Convert language format (en-US -> EN)
      const grazieLanguage = this.convertLanguageFormat(
        options.language || "en-US"
      )

      // Use services from options or default set
      const services = options.services || [
        CorrectionServiceType.MLEC,
        CorrectionServiceType.SPELL,
        CorrectionServiceType.RULE,
      ]

      console.log(
        `Sending Grazie grammar check request (${text.length} chars)...`
      )

      if (!this.client) {
        throw new Error("Grazie client is not configured")
      }

      const response = await this.client.correctText(
        [text],
        grazieLanguage,
        services
      )

      console.log("Grazie API raw response:", JSON.stringify(response, null, 2))

      // The response can either be directly an array of SentenceWithProblems,
      // or a structure with a 'corrections' property containing them
      let corrections: any[] = []

      if (Array.isArray(response)) {
        corrections = response
      } else if (
        response &&
        typeof response === "object" &&
        "corrections" in response &&
        Array.isArray(response.corrections)
      ) {
        corrections = response.corrections
      } else {
        console.warn(
          "Unexpected Grazie API response structure:",
          typeof response,
          response
        )
        return []
      }

      if (corrections.length === 0) {
        console.log("No Grazie corrections returned")
        return []
      }

      console.log(`Found ${corrections.length} correction items`)

      let allErrors: GrammarError[] = []

      // Process each sentence with problems
      for (const correction of corrections) {
        if (!correction || typeof correction !== "object") {
          console.warn("Skipping invalid correction item:", correction)
          continue
        }

        // Ensure the correction has problems array
        if (!correction.problems || !Array.isArray(correction.problems)) {
          console.warn("Correction is missing problems array:", correction)
          continue
        }

        const errors = this.convertToGrammarErrors(correction, mapping)
        console.log(
          `Processed correction with ${correction.problems.length} problems, extracted ${errors.length} errors`
        )
        allErrors = allErrors.concat(errors)
      }

      console.log(
        `Grazie found ${allErrors.length} total errors across all corrections`
      )
      return allErrors
    } catch (error) {
      if (error instanceof GrazieError) {
        console.error("Grazie API error:", error.message, error.code)
      } else {
        console.error("Grazie service error:", error)
      }
      throw error
    }
  }

  getProvider(): GrammarServiceProvider {
    return GrammarServiceProvider.GRAZIE
  }

  getSupportedLanguages(): string[] {
    return [
      "en-US",
      "en-GB",
      "en-CA",
      "en-AU",
      "de-DE",
      "de-AT",
      "de-CH",
      "es-ES",
      "es-MX",
      "es-AR",
      "fr-FR",
      "fr-CA",
      "it-IT",
      "pt-PT",
      "pt-BR",
      "ru-RU",
      "zh-CN",
      "ja-JP",
      "ko-KR",
    ]
  }

  isAvailable(): boolean {
    return this.isConfigured && this.client !== null
  }

  /**
   * Convert language format from LanguageTool format (en-US) to Grazie format (EN)
   */
  private convertLanguageFormat(languageToolFormat: string): Language {
    const languageMap: Record<string, Language> = {
      "en-US": "EN",
      "en-GB": "EN",
      "en-CA": "EN",
      "en-AU": "EN",
      "de-DE": "DE",
      "de-AT": "DE",
      "de-CH": "DE",
      "es-ES": "ES",
      "es-MX": "ES",
      "es-AR": "ES",
      "fr-FR": "FR",
      "fr-CA": "FR",
      "it-IT": "IT",
      "pt-PT": "PT",
      "pt-BR": "PT",
      "ru-RU": "RU",
      "zh-CN": "ZH",
      "ja-JP": "JA",
      "ko-KR": "KO",
    }

    return languageMap[languageToolFormat] || "EN"
  }

  /**
   * Convert Grazie SentenceWithProblems to GrammarError array
   */
  private convertToGrammarErrors(
    sentence: SentenceWithProblems,
    mapping: PositionMapping
  ): GrammarError[] {
    const errors: GrammarError[] = []

    // Additional safety check
    if (!sentence || !sentence.problems || !Array.isArray(sentence.problems)) {
      console.warn("Invalid sentence object passed to convertToGrammarErrors")
      return errors
    }

    // Log information about the sentence and problems
    console.log(
      `Processing sentence with ${sentence.problems.length} problems: ${sentence.sentence.substring(0, 50)}...`
    )

    for (const problem of sentence.problems) {
      // Add validation for problem structure
      if (
        !problem.highlighting ||
        !problem.highlighting.always ||
        !Array.isArray(problem.highlighting.always) ||
        problem.highlighting.always.length === 0 ||
        !problem.info
      ) {
        console.warn("Skipping invalid problem:", problem)
        continue
      }

      // Get the first highlighting range (always is an array)
      const highlighting = problem.highlighting.always[0]
      if (
        !highlighting ||
        typeof highlighting.start !== "number" ||
        typeof highlighting.endExclusive !== "number"
      ) {
        console.warn("Skipping problem with invalid highlighting:", problem)
        continue
      }

      // Log each problem's basic info
      console.log(
        `Problem: ${problem.info.category} at position ${highlighting.start}-${highlighting.endExclusive}`
      )

      try {
        // Skip problems for words in custom dictionary
        const problemText = sentence.sentence.substring(
          highlighting.start,
          highlighting.endExclusive
        )

        if (isInDictionary(problemText, problem.info?.id?.id)) {
          console.log(`Skipping "${problemText}" - in dictionary`)
          continue
        }

        // Skip errors that involve image placeholder
        const IMAGE_PLACEHOLDER = "⁂"
        if (problemText.includes(IMAGE_PLACEHOLDER)) {
          console.log(`Skipping "${problemText}" - contains image placeholder`)
          continue
        }

        // Get the best fix for replacement suggestions
        const replacements = this.extractReplacements(problem)
        console.log(`Found ${replacements.length} replacements for problem`)

        // Map positions back to original markdown
        const originalOffset = mapStrippedToOriginal(
          highlighting.start,
          mapping
        )
        const originalEndOffset = mapStrippedToOriginal(
          highlighting.endExclusive,
          mapping
        )
        const originalLength = originalEndOffset - originalOffset

        // Ensure we have valid mapped positions
        if (
          originalOffset < 0 ||
          originalEndOffset < 0 ||
          originalLength <= 0
        ) {
          console.warn(
            `Skipping problem with invalid mapping: ${originalOffset}-${originalEndOffset}`
          )
          continue
        }

        // Convert problem to GrammarError format
        const error: GrammarError = {
          message: problem.info.message || "Grammatical issue detected",
          shortMessage: problem.info.displayName || "Grammar issue",
          offset: highlighting.start,
          length: highlighting.endExclusive - highlighting.start,
          rule: {
            id: problem.info.id?.id || "unknown.rule",
            description: problem.info.displayName || "Unknown rule",
            category: {
              id: problem.info.category || "OTHER",
              name: this.getCategoryDisplayName(
                problem.info.category || "OTHER"
              ),
            },
          },
          replacements,
          type: this.convertProblemType(problem.info.category || "OTHER"),
          severity: this.convertSeverity(
            problem.info.confidence || "HIGH",
            problem.info.category || "OTHER"
          ),
          originalOffset,
          originalLength,
          context: {
            text: sentence.sentence,
            offset: highlighting.start,
            length: highlighting.endExclusive - highlighting.start,
          },
        }

        errors.push(error)
      } catch (err) {
        console.error("Error processing problem:", err, problem)
      }
    }

    console.log(
      `Successfully converted ${errors.length} problems to grammar errors`
    )
    return errors
  }

  /**
   * Extract replacement suggestions from Grazie problem fixes
   */
  private extractReplacements(problem: Problem): Array<{ value: string }> {
    const replacements: Array<{ value: string }> = []

    if (!problem.fixes || !Array.isArray(problem.fixes)) {
      console.warn("Problem has no fixes or fixes is not an array")
      return replacements
    }

    for (const fix of problem.fixes) {
      if (!fix.parts || !Array.isArray(fix.parts)) {
        continue
      }

      for (const part of fix.parts) {
        // Make sure this is a change part with text and range properties
        if (
          part &&
          typeof part === "object" &&
          "text" in part &&
          "range" in part
        ) {
          const change = part as { text: string; range: any }
          // Only add unique values
          if (
            change.text &&
            !replacements.some((r) => r.value === change.text)
          ) {
            replacements.push({ value: change.text })
          }
        }
      }
    }

    return replacements
  }

  /**
   * Convert Grazie problem category to spelling/grammar type
   */
  private convertProblemType(
    category: ProblemCategory | string
  ): "spelling" | "grammar" {
    // Handle both enum values and direct string values
    if (
      category === ProblemCategory.SPELLING ||
      category === "SPELLING" ||
      category === ProblemCategory.TYPOGRAPHY ||
      category === "TYPOGRAPHY"
    ) {
      return "spelling"
    }

    return "grammar"
  }

  /**
   * Convert Grazie confidence and category to severity
   */
  private convertSeverity(
    confidence: ConfidenceLevel | string,
    category: ProblemCategory | string
  ): "low" | "medium" | "high" {
    // Spelling errors are generally high priority
    if (category === ProblemCategory.SPELLING || category === "SPELLING") {
      return "high"
    }

    // Style and readability issues are lower priority
    if (
      category === ProblemCategory.STYLE ||
      category === "STYLE" ||
      category === ProblemCategory.READABILITY ||
      category === "READABILITY" ||
      category === ProblemCategory.TONE ||
      category === "TONE" ||
      category === ProblemCategory.FORMALITY ||
      category === "FORMALITY"
    ) {
      return "low"
    }

    // Grammar and semantic issues depend on confidence
    if (
      category === ProblemCategory.GRAMMAR ||
      category === "GRAMMAR" ||
      category === ProblemCategory.SEMANTICS ||
      category === "SEMANTICS"
    ) {
      return confidence === ConfidenceLevel.HIGH || confidence === "HIGH"
        ? "high"
        : "medium"
    }

    // Default based on confidence
    return confidence === ConfidenceLevel.HIGH || confidence === "HIGH"
      ? "medium"
      : "low"
  }

  /**
   * Get display name for problem category
   *
   * This method safely maps a category string to a display name, handling
   * both enum values and direct strings for better compatibility with API responses.
   */
  private getCategoryDisplayName(category: ProblemCategory | string): string {
    const categoryNames: Record<string, string> = {
      // Enum values
      [ProblemCategory.SPELLING]: "Spelling",
      [ProblemCategory.PUNCTUATION]: "Punctuation",
      [ProblemCategory.TYPOGRAPHY]: "Typography",
      [ProblemCategory.GRAMMAR]: "Grammar",
      [ProblemCategory.SEMANTICS]: "Semantics",
      [ProblemCategory.STYLE]: "Style",
      [ProblemCategory.READABILITY]: "Readability",
      [ProblemCategory.INCLUSIVITY]: "Inclusivity",
      [ProblemCategory.TONE]: "Tone",
      [ProblemCategory.FORMALITY]: "Formality",
      [ProblemCategory.OTHER]: "Other",

      // Direct string values (for redundancy)
      SPELLING: "Spelling",
      PUNCTUATION: "Punctuation",
      TYPOGRAPHY: "Typography",
      GRAMMAR: "Grammar",
      SEMANTICS: "Semantics",
      STYLE: "Style",
      READABILITY: "Readability",
      INCLUSIVITY: "Inclusivity",
      TONE: "Tone",
      FORMALITY: "Formality",
      OTHER: "Other",
    }

    // Safely check if the category is a valid key
    if (typeof category === "string" && category in categoryNames) {
      return categoryNames[category]
    }

    return "Other"
  }
}
