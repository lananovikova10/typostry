/**
 * Client-side environment configuration
 */

interface ClientEnvConfig {
  grazieToken?: string
  languageToolApiUrl?: string
}

class ClientEnvironment {
  private config: ClientEnvConfig = {}

  constructor() {
    // Only access environment variables on the server side
    if (typeof window === 'undefined') {
      this.config.grazieToken = process.env.GRAZIE_JWT_TOKEN
      this.config.languageToolApiUrl = process.env.LANGUAGETOOL_API_URL
    }
  }

  /**
   * Get Grazie JWT token
   */
  getGrazieToken(): string | undefined {
    return this.config.grazieToken
  }

  /**
   * Set Grazie JWT token manually (for client-side configuration)
   */
  setGrazieToken(token: string): void {
    this.config.grazieToken = token
  }

  /**
   * Get LanguageTool API URL
   */
  getLanguageToolApiUrl(): string | undefined {
    return this.config.languageToolApiUrl
  }

  /**
   * Set LanguageTool API URL manually
   */
  setLanguageToolApiUrl(url: string): void {
    this.config.languageToolApiUrl = url
  }

  /**
   * Check if Grazie is configured
   */
  isGrazieConfigured(): boolean {
    return !!this.config.grazieToken
  }

  /**
   * Get all configuration
   */
  getConfig(): ClientEnvConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ClientEnvConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Clear all configuration
   */
  clearConfig(): void {
    this.config = {}
  }
}

// Singleton instance
export const clientEnv = new ClientEnvironment()

// Export the class for testing
export { ClientEnvironment }