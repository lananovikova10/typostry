import { NextRequest, NextResponse } from 'next/server'
import { grammarServiceManager, GrammarServiceProvider } from '@/lib/grammar-check'

export async function POST(request: NextRequest) {
  try {
    const { text, service, language } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // Switch to requested service if provided
    if (service && Object.values(GrammarServiceProvider).includes(service)) {
      try {
        grammarServiceManager.setActiveService(service)
      } catch (error) {
        return NextResponse.json(
          { error: `Failed to switch to service: ${service}` },
          { status: 400 }
        )
      }
    }

    // Simple position mapping for testing
    const mapping = {
      originalToStripped: new Map(),
      strippedToOriginal: new Map(),
    }

    // Populate mapping for the text as-is
    for (let i = 0; i < text.length; i++) {
      mapping.originalToStripped.set(i, i)
      mapping.strippedToOriginal.set(i, i)
    }

    const results = await grammarServiceManager.checkGrammar(text, mapping, {
      language: language || 'en-US'
    })

    const activeService = grammarServiceManager.getActiveService()
    const serviceStats = grammarServiceManager.getServiceStats()

    return NextResponse.json({
      success: true,
      activeService: activeService.getProvider(),
      serviceStats,
      results,
      textLength: text.length,
      errorsFound: results.length
    })

  } catch (error) {
    console.error('Grammar check API error:', error)
    return NextResponse.json(
      { 
        error: 'Grammar check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const serviceStats = grammarServiceManager.getServiceStats()
    const preferences = grammarServiceManager.getPreferences()
    const availableServices = grammarServiceManager.getAvailableServices()

    return NextResponse.json({
      serviceStats,
      preferences,
      availableServices: availableServices.map(service => ({
        provider: service.getProvider(),
        isAvailable: service.isAvailable(),
        supportedLanguages: service.getSupportedLanguages().length
      }))
    })
  } catch (error) {
    console.error('Grammar service info API error:', error)
    return NextResponse.json(
      { error: 'Failed to get service information' },
      { status: 500 }
    )
  }
}