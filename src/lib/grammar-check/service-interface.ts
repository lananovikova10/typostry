/**
 * Unified interface for grammar checking services
 */

import { GrammarError, PositionMapping } from "./types"
import { Language, CorrectionServiceType } from "@/types/grazie"

export enum GrammarServiceProvider {
  LANGUAGETOOL = 'languagetool',
  GRAZIE = 'grazie'
}

export interface GrammarServiceConfig {
  provider: GrammarServiceProvider
  apiUrl?: string
  token?: string
  language?: string
  disabledRules?: string[]
  services?: CorrectionServiceType[] // For Grazie
  level?: string // For LanguageTool
}

export interface GrammarServiceOptions {
  language?: string
  disabledRules?: string[]
  services?: CorrectionServiceType[]
  level?: string
}

export interface IGrammarService {
  /**
   * Check grammar and spelling in the provided text
   */
  checkGrammar(
    text: string, 
    mapping: PositionMapping, 
    options?: GrammarServiceOptions
  ): Promise<GrammarError[]>

  /**
   * Get the service provider name
   */
  getProvider(): GrammarServiceProvider

  /**
   * Get supported languages for this service
   */
  getSupportedLanguages(): string[]

  /**
   * Check if the service is available/configured
   */
  isAvailable(): boolean
}

export interface GrammarServiceManager {
  /**
   * Get the currently active service
   */
  getActiveService(): IGrammarService

  /**
   * Switch to a different service
   */
  setActiveService(provider: GrammarServiceProvider): void

  /**
   * Get all available services
   */
  getAvailableServices(): IGrammarService[]

  /**
   * Check grammar using the active service
   */
  checkGrammar(
    text: string,
    mapping: PositionMapping,
    options?: GrammarServiceOptions
  ): Promise<GrammarError[]>

  /**
   * Reinitialize a specific service (useful after configuration changes)
   */
  reinitializeService(provider: GrammarServiceProvider): void

  /**
   * Reinitialize all services (useful after major configuration changes)
   */
  reinitializeAllServices(): void
}

export interface ServicePreferences {
  activeProvider: GrammarServiceProvider
  languageToolConfig: {
    language: string
    level: string
    disabledRules: string[]
  }
  grazieConfig: {
    language: Language
    services: CorrectionServiceType[]
  }
}