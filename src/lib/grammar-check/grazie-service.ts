/**
 * Grazie API service implementation
 */

import { IGrammarService, GrammarServiceProvider, GrammarServiceOptions } from "./service-interface"
import { GrammarError, PositionMapping } from "./types"
import { GrazieClient, createGrazieClient, GrazieError } from "../grazie-client"
import { Language, CorrectionServiceType, SentenceWithProblems, Problem, ProblemCategory, ConfidenceLevel } from "@/types/grazie"
import { mapStrippedToOriginal } from "./preprocessor"
import { isInDictionary } from "./dictionary"
import { clientEnv } from "../env-client"

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
      const grazieLanguage = this.convertLanguageFormat(options.language || "en-US")
      
      // Use services from options or default set
      const services = options.services || [
        CorrectionServiceType.MLEC,
        CorrectionServiceType.SPELL,
        CorrectionServiceType.RULE
      ]

      console.log(`Sending Grazie grammar check request (${text.length} chars)...`)
      
      if (!this.client) {
        throw new Error("Grazie client is not configured")
      }
      
      const results = await this.client.correctText([text], grazieLanguage, services)
      
      if (results.length === 0) {
        console.log("No Grazie results returned")
        return []
      }

      const sentenceResult = results[0]
      const errors = this.convertToGrammarErrors(sentenceResult, mapping)
      
      console.log(`Grazie found ${sentenceResult.problems.length} problems, converted to ${errors.length} errors`)
      return errors
    } catch (error) {
      if (error instanceof GrazieError) {
        console.error("Grazie API error:", error.message, error.code)
      } else {
        console.error("Grazie service error:", error)
      }
      return []
    }
  }

  getProvider(): GrammarServiceProvider {
    return GrammarServiceProvider.GRAZIE
  }

  getSupportedLanguages(): string[] {
    return [
      "en-US", "en-GB", "en-CA", "en-AU",
      "de-DE", "de-AT", "de-CH",
      "es-ES", "es-MX", "es-AR",
      "fr-FR", "fr-CA",
      "it-IT",
      "pt-PT", "pt-BR",
      "ru-RU",
      "zh-CN",
      "ja-JP",
      "ko-KR"
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
      "ko-KR": "KO"
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

    for (const problem of sentence.problems) {
      // Skip problems for words in custom dictionary
      const problemText = sentence.sentence.substring(
        problem.highlighting.always.start,
        problem.highlighting.always.endExclusive
      )
      
      if (isInDictionary(problemText, problem.info.id.id)) {
        continue
      }

      // Skip errors that involve image placeholder
      const IMAGE_PLACEHOLDER = "⁂"
      if (problemText.includes(IMAGE_PLACEHOLDER)) {
        continue
      }

      // Get the best fix for replacement suggestions
      const replacements = this.extractReplacements(problem)

      // Map positions back to original markdown
      const originalOffset = mapStrippedToOriginal(
        problem.highlighting.always.start,
        mapping
      )
      const originalEndOffset = mapStrippedToOriginal(
        problem.highlighting.always.endExclusive,
        mapping
      )
      const originalLength = originalEndOffset - originalOffset

      // Convert problem to GrammarError format
      const error: GrammarError = {
        message: problem.info.message,
        shortMessage: problem.info.displayName,
        offset: problem.highlighting.always.start,
        length: problem.highlighting.always.endExclusive - problem.highlighting.always.start,
        rule: {
          id: problem.info.id.id,
          description: problem.info.displayName,
          category: {
            id: problem.info.category,
            name: this.getCategoryDisplayName(problem.info.category)
          }
        },
        replacements,
        type: this.convertProblemType(problem.info.category),
        severity: this.convertSeverity(problem.info.confidence, problem.info.category),
        originalOffset,
        originalLength,
        context: {
          text: sentence.sentence,
          offset: problem.highlighting.always.start,
          length: problem.highlighting.always.endExclusive - problem.highlighting.always.start
        }
      }

      errors.push(error)
    }

    return errors
  }

  /**
   * Extract replacement suggestions from Grazie problem fixes
   */
  private extractReplacements(problem: Problem): Array<{ value: string }> {
    const replacements: Array<{ value: string }> = []

    for (const fix of problem.fixes) {
      for (const part of fix.parts) {
        if ('text' in part && 'range' in part) {
          const change = part as { text: string; range: any }
          replacements.push({ value: change.text })
        }
      }
    }

    return replacements
  }

  /**
   * Convert Grazie problem category to spelling/grammar type
   */
  private convertProblemType(category: ProblemCategory): "spelling" | "grammar" {
    switch (category) {
      case ProblemCategory.SPELLING:
        return "spelling"
      case ProblemCategory.TYPOGRAPHY:
        return "spelling"
      default:
        return "grammar"
    }
  }

  /**
   * Convert Grazie confidence and category to severity
   */
  private convertSeverity(
    confidence: ConfidenceLevel,
    category: ProblemCategory
  ): "low" | "medium" | "high" {
    // Spelling errors are generally high priority
    if (category === ProblemCategory.SPELLING) {
      return "high"
    }

    // Style and readability issues are lower priority
    if (
      category === ProblemCategory.STYLE ||
      category === ProblemCategory.READABILITY ||
      category === ProblemCategory.TONE ||
      category === ProblemCategory.FORMALITY
    ) {
      return "low"
    }

    // Grammar and semantic issues depend on confidence
    if (
      category === ProblemCategory.GRAMMAR ||
      category === ProblemCategory.SEMANTICS
    ) {
      return confidence === ConfidenceLevel.HIGH ? "high" : "medium"
    }

    // Default based on confidence
    return confidence === ConfidenceLevel.HIGH ? "medium" : "low"
  }

  /**
   * Get display name for problem category
   */
  private getCategoryDisplayName(category: ProblemCategory): string {
    const categoryNames: Record<ProblemCategory, string> = {
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
      [ProblemCategory.OTHER]: "Other"
    }

    return categoryNames[category] || "Other"
  }
}