/**
 * Grammar service manager - handles switching between different grammar checking services
 */

import { IGrammarService, GrammarServiceManager, GrammarServiceProvider, GrammarServiceOptions, ServicePreferences } from "./service-interface"
import { GrammarError, PositionMapping } from "./types"
import { LanguageToolService } from "./languagetool-service"
import { GrazieService } from "./grazie-service"
import { CorrectionServiceType, Language } from "@/types/grazie"

const PREFERENCES_KEY = "grammar-service-preferences"

export class GrammarServiceManagerImpl implements GrammarServiceManager {
  private services: Map<GrammarServiceProvider, IGrammarService>
  private activeProvider: GrammarServiceProvider
  private preferences: ServicePreferences

  constructor() {
    // Initialize services
    this.services = new Map()
    this.services.set(GrammarServiceProvider.LANGUAGETOOL, new LanguageToolService())
    this.services.set(GrammarServiceProvider.GRAZIE, new GrazieService())

    // Load preferences
    this.preferences = this.loadPreferences()
    this.activeProvider = this.preferences.activeProvider

    // Validate that the active provider is available
    if (!this.getActiveService().isAvailable()) {
      // Fall back to an available service
      this.activeProvider = this.findAvailableProvider()
      this.preferences.activeProvider = this.activeProvider
      this.savePreferences()
    }
  }

  getActiveService(): IGrammarService {
    const service = this.services.get(this.activeProvider)
    if (!service) {
      throw new Error(`Service not found: ${this.activeProvider}`)
    }
    return service
  }

  setActiveService(provider: GrammarServiceProvider): void {
    const service = this.services.get(provider)
    if (!service) {
      throw new Error(`Service not found: ${provider}`)
    }

    if (!service.isAvailable()) {
      throw new Error(`Service not available: ${provider}`)
    }

    this.activeProvider = provider
    this.preferences.activeProvider = provider
    this.savePreferences()
    
    console.log(`Switched to grammar service: ${provider}`)
  }

  getAvailableServices(): IGrammarService[] {
    return Array.from(this.services.values()).filter(service => service.isAvailable())
  }

  async checkGrammar(
    text: string,
    mapping: PositionMapping,
    options?: GrammarServiceOptions
  ): Promise<GrammarError[]> {
    const activeService = this.getActiveService()
    
    // Merge options with preferences
    const mergedOptions = this.mergeOptionsWithPreferences(options)
    
    return activeService.checkGrammar(text, mapping, mergedOptions)
  }

  /**
   * Get all registered services (available and unavailable)
   */
  getAllServices(): IGrammarService[] {
    return Array.from(this.services.values())
  }

  /**
   * Check if a specific service is available
   */
  isServiceAvailable(provider: GrammarServiceProvider): boolean {
    const service = this.services.get(provider)
    return service ? service.isAvailable() : false
  }

  /**
   * Get the current preferences
   */
  getPreferences(): ServicePreferences {
    return { ...this.preferences }
  }

  /**
   * Update preferences
   */
  updatePreferences(updates: Partial<ServicePreferences>): void {
    this.preferences = {
      ...this.preferences,
      ...updates
    }
    this.savePreferences()
  }

  /**
   * Update LanguageTool specific preferences
   */
  updateLanguageToolPreferences(config: Partial<ServicePreferences['languageToolConfig']>): void {
    this.preferences.languageToolConfig = {
      ...this.preferences.languageToolConfig,
      ...config
    }
    this.savePreferences()
  }

  /**
   * Update Grazie specific preferences
   */
  updateGraziePreferences(config: Partial<ServicePreferences['grazieConfig']>): void {
    this.preferences.grazieConfig = {
      ...this.preferences.grazieConfig,
      ...config
    }
    this.savePreferences()
    // Reinitialize Grazie service to pick up new config
    this.reinitializeService(GrammarServiceProvider.GRAZIE)
  }

  /**
   * Reset preferences to defaults
   */
  resetPreferences(): void {
    this.preferences = this.getDefaultPreferences()
    this.activeProvider = this.preferences.activeProvider
    this.savePreferences()
  }

  /**
   * Reinitialize a specific service (useful after configuration changes)
   */
  reinitializeService(provider: GrammarServiceProvider): void {
    try {
      if (provider === GrammarServiceProvider.LANGUAGETOOL) {
        this.services.set(provider, new LanguageToolService())
      } else if (provider === GrammarServiceProvider.GRAZIE) {
        this.services.set(provider, new GrazieService())
      }
      console.log(`Reinitialized service: ${provider}`)
    } catch (error) {
      console.error(`Failed to reinitialize service ${provider}:`, error)
    }
  }

  /**
   * Reinitialize all services (useful after major configuration changes)
   */
  reinitializeAllServices(): void {
    this.services.clear()
    this.services.set(GrammarServiceProvider.LANGUAGETOOL, new LanguageToolService())
    this.services.set(GrammarServiceProvider.GRAZIE, new GrazieService())
    
    // Validate that the active provider is still available
    if (!this.getActiveService().isAvailable()) {
      this.activeProvider = this.findAvailableProvider()
      this.preferences.activeProvider = this.activeProvider
      this.savePreferences()
    }
  }

  /**
   * Get service statistics
   */
  getServiceStats(): {
    totalServices: number
    availableServices: number
    activeService: string
    supportedLanguages: number
  } {
    const available = this.getAvailableServices()
    const activeService = this.getActiveService()
    
    return {
      totalServices: this.services.size,
      availableServices: available.length,
      activeService: activeService.getProvider(),
      supportedLanguages: activeService.getSupportedLanguages().length
    }
  }

  /**
   * Find the first available service provider
   */
  private findAvailableProvider(): GrammarServiceProvider {
    for (const [provider, service] of Array.from(this.services)) {
      if (service.isAvailable()) {
        return provider
      }
    }
    
    // Default to LanguageTool as it's always available
    return GrammarServiceProvider.LANGUAGETOOL
  }

  /**
   * Merge provided options with current preferences
   */
  private mergeOptionsWithPreferences(options?: GrammarServiceOptions): GrammarServiceOptions {
    if (this.activeProvider === GrammarServiceProvider.LANGUAGETOOL) {
      return {
        language: options?.language || this.preferences.languageToolConfig.language,
        disabledRules: options?.disabledRules || this.preferences.languageToolConfig.disabledRules,
        level: options?.level || this.preferences.languageToolConfig.level,
        ...options
      }
    } else if (this.activeProvider === GrammarServiceProvider.GRAZIE) {
      return {
        language: this.convertGrazieToLanguageToolLanguage(this.preferences.grazieConfig.language),
        services: options?.services || this.preferences.grazieConfig.services,
        ...options
      }
    }
    
    return options || {}
  }

  /**
   * Convert Grazie language format to LanguageTool format for compatibility
   */
  private convertGrazieToLanguageToolLanguage(grazieLanguage: Language | string): string {
    const languageMap: Record<Language, string> = {
      "EN": "en-US",
      "DE": "de-DE",
      "ES": "es-ES",
      "FR": "fr-FR",
      "IT": "it-IT",
      "PT": "pt-PT",
      "RU": "ru-RU",
      "ZH": "zh-CN",
      "JA": "ja-JP",
      "KO": "ko-KR"
    }
    
    return languageMap[grazieLanguage as Language] || "en-US"
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): ServicePreferences {
    if (typeof window === 'undefined') {
      return this.getDefaultPreferences()
    }

    try {
      const stored = localStorage.getItem(PREFERENCES_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults to ensure all properties exist
        return {
          ...this.getDefaultPreferences(),
          ...parsed
        }
      }
    } catch (error) {
      console.warn("Failed to load grammar service preferences:", error)
    }

    return this.getDefaultPreferences()
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(this.preferences))
    } catch (error) {
      console.warn("Failed to save grammar service preferences:", error)
    }
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(): ServicePreferences {
    return {
      activeProvider: GrammarServiceProvider.LANGUAGETOOL,
      languageToolConfig: {
        language: "en-US",
        level: "default",
        disabledRules: []
      },
      grazieConfig: {
        language: "EN",
        services: [
          CorrectionServiceType.MLEC,
          CorrectionServiceType.SPELL,
          CorrectionServiceType.RULE
        ]
      }
    }
  }
}

// Singleton instance
let instance: GrammarServiceManagerImpl | null = null

export function getGrammarServiceManager(): GrammarServiceManagerImpl {
  if (!instance) {
    instance = new GrammarServiceManagerImpl()
  }
  return instance
}

// Export the singleton for convenience
export const grammarServiceManager = getGrammarServiceManager()