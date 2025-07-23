"use client"

import { useState, useEffect } from "react"
import { Check, Settings, Zap, Globe, Shield, AlertCircle, PenLine } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { GrammarServiceProvider, ServicePreferences } from "@/lib/grammar-check/service-interface"
import { grammarServiceManager } from "@/lib/grammar-check/service-manager"
import { CorrectionServiceType, Language } from "@/types/grazie"
import { clientEnv } from "@/lib/env-client"

interface GrammarSettingsProps {
  onServiceChange?: (provider: GrammarServiceProvider) => void
}

export function GrammarSettings({ onServiceChange }: GrammarSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [preferences, setPreferences] = useState<ServicePreferences>(() => 
    grammarServiceManager.getPreferences()
  )
  const [availableServices, setAvailableServices] = useState<GrammarServiceProvider[]>([])
  const [grazieToken, setGrazieToken] = useState("")
  const [tokenConfigured, setTokenConfigured] = useState(false)
  const [tokenError, setTokenError] = useState("")
  const [activeTab, setActiveTab] = useState<string>(GrammarServiceProvider.LANGUAGETOOL)

  useEffect(() => {
    // Get available services
    const services = grammarServiceManager.getAvailableServices()
    setAvailableServices(services.map(s => s.getProvider()))
    
    // Load current preferences
    const currentPrefs = grammarServiceManager.getPreferences()
    setPreferences(currentPrefs)
    
    // Set the active tab to the current service
    setActiveTab(currentPrefs.activeProvider)
    
    // Check if Grazie token is already configured
    setTokenConfigured(clientEnv.isGrazieConfigured())
    if (clientEnv.isGrazieConfigured()) {
      setGrazieToken("••••••••••••••••") // Show masked token
    }
  }, [])

  const handleServiceChange = (provider: string) => {
    const serviceProvider = provider as GrammarServiceProvider
    try {
      grammarServiceManager.setActiveService(serviceProvider)
      const newPreferences = grammarServiceManager.getPreferences()
      setPreferences(newPreferences)
      onServiceChange?.(serviceProvider)
    } catch (error) {
      console.error("Failed to switch service:", error)
    }
  }

  const handleLanguageToolConfigChange = (key: keyof ServicePreferences['languageToolConfig'], value: any) => {
    const newConfig = { ...preferences.languageToolConfig, [key]: value }
    grammarServiceManager.updateLanguageToolPreferences(newConfig)
    setPreferences(grammarServiceManager.getPreferences())
  }

  const handleGrazieConfigChange = (key: keyof ServicePreferences['grazieConfig'], value: any) => {
    const newConfig = { ...preferences.grazieConfig, [key]: value }
    grammarServiceManager.updateGraziePreferences(newConfig)
    setPreferences(grammarServiceManager.getPreferences())
  }

  const toggleGrazieService = (service: CorrectionServiceType, enabled: boolean) => {
    const currentServices = preferences.grazieConfig.services
    let newServices: CorrectionServiceType[]
    
    if (enabled && !currentServices.includes(service)) {
      newServices = [...currentServices, service]
    } else if (!enabled && currentServices.includes(service)) {
      newServices = currentServices.filter(s => s !== service)
    } else {
      return // No change needed
    }
    
    handleGrazieConfigChange('services', newServices)
  }

  const isServiceAvailable = (provider: GrammarServiceProvider) => {
    return grammarServiceManager.isServiceAvailable(provider)
  }

  const handleTokenSubmit = async () => {
    if (!grazieToken.trim() || grazieToken === "••••••••••••••••") {
      setTokenError("Please enter a valid Grazie JWT token")
      return
    }

    setTokenError("") // Clear any previous errors

    try {
      // Set the token in client environment first
      clientEnv.setGrazieToken(grazieToken)
      
      // Reinitialize the Grazie service to pick up the new token
      grammarServiceManager.reinitializeService(GrammarServiceProvider.GRAZIE)
      
      // Check if the service is now available
      const isNowAvailable = grammarServiceManager.isServiceAvailable(GrammarServiceProvider.GRAZIE)
      
      if (isNowAvailable) {
        setTokenConfigured(true)
        setTokenError("")
        
        // Refresh available services
        const services = grammarServiceManager.getAvailableServices()
        setAvailableServices(services.map(s => s.getProvider()))
        
        // Mask the token in the UI
        setGrazieToken("••••••••••••••••")
      } else {
        throw new Error("Token configuration failed - service is still unavailable")
      }
    } catch (error) {
      console.error("Token configuration error:", error)
      setTokenError(error instanceof Error ? error.message : "Failed to configure token")
      setTokenConfigured(false)
      // Clear the token from client env if configuration failed
      clientEnv.setGrazieToken("")
    }
  }

  const handleTokenClear = () => {
    try {
      // Clear the token from client environment
      clientEnv.clearConfig()
      
      // Reinitialize the Grazie service (will be unavailable without token)
      grammarServiceManager.reinitializeService(GrammarServiceProvider.GRAZIE)
      
      setGrazieToken("")
      setTokenConfigured(false)
      setTokenError("")
      
      // Refresh available services
      const services = grammarServiceManager.getAvailableServices()
      setAvailableServices(services.map(s => s.getProvider()))
      
      // Switch back to LanguageTool if Grazie was active
      if (preferences.activeProvider === GrammarServiceProvider.GRAZIE) {
        handleServiceChange(GrammarServiceProvider.LANGUAGETOOL)
      }
    } catch (error) {
      console.error("Error clearing token:", error)
      setTokenError("Failed to clear token")
    }
  }

  const getServiceIcon = (provider: GrammarServiceProvider) => {
    switch (provider) {
      case GrammarServiceProvider.LANGUAGETOOL:
        return <Globe className="h-4 w-4" />
      case GrammarServiceProvider.GRAZIE:
        return <Zap className="h-4 w-4" />
      default:
        return <Shield className="h-4 w-4" />
    }
  }

  const getServiceDescription = (provider: GrammarServiceProvider) => {
    switch (provider) {
      case GrammarServiceProvider.LANGUAGETOOL:
        return "Open-source grammar and style checker with wide language support"
      case GrammarServiceProvider.GRAZIE:
        return "JetBrains AI-powered grammar and style checker with advanced capabilities"
      default:
        return ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="grammar-settings-btn h-8 w-8 flex-shrink-0 text-[hsl(var(--markdown-toolbar-icon))] hover:bg-secondary/70 hover:text-[hsl(var(--markdown-toolbar-icon-hover))]"
          title="Grammar & Spell Check Settings"
        >
          <PenLine className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Grammar Check Settings</DialogTitle>
          <DialogDescription>
            Configure your preferred grammar checking service and options
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Service Selection */}
          <div className="space-y-3">
            <Label htmlFor="service-select">Grammar Service</Label>
            <Select
              value={preferences.activeProvider}
              onValueChange={handleServiceChange}
            >
              <SelectTrigger id="service-select">
                <SelectValue placeholder="Select a grammar service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem 
                  value={GrammarServiceProvider.LANGUAGETOOL}
                  disabled={!isServiceAvailable(GrammarServiceProvider.LANGUAGETOOL)}
                >
                  <div className="flex items-center gap-2">
                    {getServiceIcon(GrammarServiceProvider.LANGUAGETOOL)}
                    <span>LanguageTool</span>
                    {isServiceAvailable(GrammarServiceProvider.LANGUAGETOOL) ? (
                      <Badge variant="secondary">Available</Badge>
                    ) : (
                      <Badge variant="destructive">Unavailable</Badge>
                    )}
                  </div>
                </SelectItem>
                <SelectItem 
                  value={GrammarServiceProvider.GRAZIE}
                  disabled={!isServiceAvailable(GrammarServiceProvider.GRAZIE)}
                >
                  <div className="flex items-center gap-2">
                    {getServiceIcon(GrammarServiceProvider.GRAZIE)}
                    <span>Grazie</span>
                    {isServiceAvailable(GrammarServiceProvider.GRAZIE) ? (
                      <Badge variant="secondary">Available</Badge>
                    ) : (
                      <Badge variant="destructive">Unavailable</Badge>
                    )}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {getServiceDescription(preferences.activeProvider)}
            </p>
          </div>

          <Separator />

          {/* Service-specific settings */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value={GrammarServiceProvider.LANGUAGETOOL}>
                LanguageTool Settings
              </TabsTrigger>
              <TabsTrigger value={GrammarServiceProvider.GRAZIE}>
                Grazie Settings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={GrammarServiceProvider.LANGUAGETOOL} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">LanguageTool Configuration</CardTitle>
                  <CardDescription>
                    Configure LanguageTool-specific options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="lt-language">Language</Label>
                    <Select
                      value={preferences.languageToolConfig.language}
                      onValueChange={(value) => handleLanguageToolConfigChange('language', value)}
                    >
                      <SelectTrigger id="lt-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="en-GB">English (UK)</SelectItem>
                        <SelectItem value="de-DE">German</SelectItem>
                        <SelectItem value="es-ES">Spanish</SelectItem>
                        <SelectItem value="fr-FR">French</SelectItem>
                        <SelectItem value="it-IT">Italian</SelectItem>
                        <SelectItem value="pt-PT">Portuguese</SelectItem>
                        <SelectItem value="ru-RU">Russian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lt-level">Checking Level</Label>
                    <Select
                      value={preferences.languageToolConfig.level}
                      onValueChange={(value) => handleLanguageToolConfigChange('level', value)}
                    >
                      <SelectTrigger id="lt-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="picky">Picky (More suggestions)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value={GrammarServiceProvider.GRAZIE} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Grazie Configuration</CardTitle>
                  <CardDescription>
                    Configure Grazie AI-powered grammar checking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isServiceAvailable(GrammarServiceProvider.GRAZIE) && (
                    <div className="space-y-3">
                      <div className="space-y-2 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                            Grazie service requires a JWT token
                          </p>
                        </div>
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          Get your token from JetBrains AI Platform. The token from your message starts with &quot;eyJhbGciOiJSUzUxMi...&quot;
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="grazie-token">Grazie JWT Token</Label>
                          <p className="text-xs text-muted-foreground">
                            Paste your JetBrains AI Platform JWT token here
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id="grazie-token"
                            type="password"
                            placeholder="eyJhbGciOiJSUzUxMi..."
                            value={grazieToken}
                            onChange={(e) => {
                              setGrazieToken(e.target.value)
                              setTokenError("") // Clear errors when user types
                            }}
                            className="flex-1 font-mono text-xs"
                            disabled={tokenConfigured}
                          />
                          {tokenConfigured ? (
                            <Button variant="outline" onClick={handleTokenClear}>
                              Clear
                            </Button>
                          ) : (
                            <Button 
                              onClick={handleTokenSubmit}
                              disabled={!grazieToken.trim() || grazieToken === "••••••••••••••••"}
                            >
                              Configure
                            </Button>
                          )}
                        </div>
                        {tokenError && (
                          <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <p className="text-sm text-red-700 dark:text-red-300">{tokenError}</p>
                          </div>
                        )}
                        {tokenConfigured && (
                          <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                            <Check className="h-4 w-4 text-green-600" />
                            <p className="text-sm text-green-700 dark:text-green-300">
                              Grazie token configured successfully
                            </p>
                          </div>
                        )}
                        {!tokenConfigured && !tokenError && grazieToken && (
                          <p className="text-sm text-muted-foreground">
                            Click &quot;Configure&quot; to activate Grazie service with your token
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="grazie-language">Language</Label>
                    <Select
                      value={preferences.grazieConfig.language}
                      onValueChange={(value: Language) => handleGrazieConfigChange('language', value)}
                    >
                      <SelectTrigger id="grazie-language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EN">English</SelectItem>
                        <SelectItem value="DE">German</SelectItem>
                        <SelectItem value="ES">Spanish</SelectItem>
                        <SelectItem value="FR">French</SelectItem>
                        <SelectItem value="IT">Italian</SelectItem>
                        <SelectItem value="PT">Portuguese</SelectItem>
                        <SelectItem value="RU">Russian</SelectItem>
                        <SelectItem value="ZH">Chinese</SelectItem>
                        <SelectItem value="JA">Japanese</SelectItem>
                        <SelectItem value="KO">Korean</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Correction Services</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">MLEC</Label>
                          <p className="text-xs text-muted-foreground">
                            Machine Learning Error Correction
                          </p>
                        </div>
                        <Switch
                          checked={preferences.grazieConfig.services.includes(CorrectionServiceType.MLEC)}
                          onCheckedChange={(checked) => toggleGrazieService(CorrectionServiceType.MLEC, checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Spell Check</Label>
                          <p className="text-xs text-muted-foreground">
                            Spelling error detection
                          </p>
                        </div>
                        <Switch
                          checked={preferences.grazieConfig.services.includes(CorrectionServiceType.SPELL)}
                          onCheckedChange={(checked) => toggleGrazieService(CorrectionServiceType.SPELL, checked)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Rule-based</Label>
                          <p className="text-xs text-muted-foreground">
                            Grammar and style rules
                          </p>
                        </div>
                        <Switch
                          checked={preferences.grazieConfig.services.includes(CorrectionServiceType.RULE)}
                          onCheckedChange={(checked) => toggleGrazieService(CorrectionServiceType.RULE, checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Service Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Active Service</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getServiceIcon(preferences.activeProvider)}
                    <span className="font-medium">
                      {preferences.activeProvider === GrammarServiceProvider.LANGUAGETOOL 
                        ? 'LanguageTool' 
                        : 'Grazie'}
                    </span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Available Services</Label>
                  <div className="mt-1">
                    <span className="font-medium">{availableServices.length} of 2</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}