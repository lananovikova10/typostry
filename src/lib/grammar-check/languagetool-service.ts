/**
 * LanguageTool service implementation
 */

import { IGrammarService, GrammarServiceProvider, GrammarServiceOptions } from "./service-interface"
import { GrammarError, PositionMapping } from "./types"
import { checkGrammar as checkGrammarWithLanguageTool } from "./api"

export class LanguageToolService implements IGrammarService {
  private isConfigured: boolean

  constructor() {
    // LanguageTool doesn't require special configuration, it's always available
    this.isConfigured = true
  }

  async checkGrammar(
    text: string,
    mapping: PositionMapping,
    options: GrammarServiceOptions = {}
  ): Promise<GrammarError[]> {
    if (!this.isAvailable()) {
      throw new Error("LanguageTool service is not available")
    }

    if (!text.trim()) {
      return []
    }

    try {
      console.log(`Sending LanguageTool grammar check request (${text.length} chars)...`)
      
      // Convert options to LanguageTool format
      const languageToolOptions = {
        language: options.language || "en-US",
        disabledRules: options.disabledRules || []
      }

      const errors = await checkGrammarWithLanguageTool(text, mapping, languageToolOptions)
      
      console.log(`LanguageTool found ${errors.length} errors`)
      return errors
    } catch (error) {
      console.error("LanguageTool service error:", error)
      return []
    }
  }

  getProvider(): GrammarServiceProvider {
    return GrammarServiceProvider.LANGUAGETOOL
  }

  getSupportedLanguages(): string[] {
    return [
      "en-US", "en-GB", "en-CA", "en-AU", "en-NZ", "en-ZA",
      "de-DE", "de-AT", "de-CH",
      "es-ES", "es-MX", "es-AR", "es-CL", "es-CO", "es-PE", "es-VE",
      "fr-FR", "fr-CA", "fr-BE", "fr-CH",
      "it-IT",
      "pt-PT", "pt-BR", "pt-AO", "pt-MZ",
      "ru-RU",
      "nl-NL", "nl-BE",
      "pl-PL",
      "sv-SE",
      "da-DK",
      "no-NO",
      "fi-FI",
      "ca-ES",
      "gl-ES",
      "eu-ES",
      "zh-CN",
      "ja-JP",
      "uk-UA",
      "ro-RO",
      "sk-SK",
      "sl-SI",
      "lt-LT",
      "lv-LV",
      "et-EE",
      "hr-HR",
      "cs-CZ",
      "hu-HU",
      "bg-BG",
      "el-GR",
      "is-IS",
      "mt-MT",
      "ga-IE",
      "cy-GB",
      "br-FR",
      "eo",
      "ar-DZ", "ar-EG", "ar-MA", "ar-TN",
      "fa-IR",
      "he-IL",
      "hi-IN",
      "ta-IN",
      "ml-IN",
      "bn-BD",
      "th-TH",
      "vi-VN",
      "ko-KR",
      "ms-MY",
      "id-ID",
      "tl-PH"
    ]
  }

  isAvailable(): boolean {
    return this.isConfigured
  }

  /**
   * Get the maximum text length supported by LanguageTool
   */
  getMaxTextLength(): number {
    return 10000 // 10KB as defined in the existing API
  }

  /**
   * Get the minimum request interval for rate limiting
   */
  getMinRequestInterval(): number {
    return 5000 // 5 seconds as defined in the existing API
  }

  /**
   * Check if a language is supported by LanguageTool
   */
  isLanguageSupported(language: string): boolean {
    return this.getSupportedLanguages().includes(language)
  }

  /**
   * Get the default language for LanguageTool
   */
  getDefaultLanguage(): string {
    return "en-US"
  }

  /**
   * Get available checking levels
   */
  getAvailableLevels(): string[] {
    return ["default", "picky"]
  }
}