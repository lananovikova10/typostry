import { NextRequest, NextResponse } from 'next/server';

/**
 * API route for NLC text completion
 * Proxies requests to the Grazie platform
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { context, language } = body;

    // Validate input
    if (!context || typeof context !== 'string') {
      return NextResponse.json(
        { error: 'Context is required and must be a string' },
        { status: 400 }
      );
    }

    if (!['en', 'de'].includes(language)) {
      return NextResponse.json(
        { error: 'Language must be "en" or "de"' },
        { status: 400 }
      );
    }

    // Note: v3 API doesn't use 'profile' parameter

    // Get token from server-side environment variables (more secure than client-side)
    // Use GRAZIE_TOKEN (production with NLC permissions) as primary
    const token = process.env.GRAZIE_TOKEN || process.env.GRAZIE_DEV_TOKEN || process.env.NEXT_PUBLIC_GRAZIE_TOKEN;

    if (!token) {
      console.error('❌ Missing GRAZIE_TOKEN environment variable');
      return NextResponse.json(
        { error: 'Server configuration error: Authentication token not configured' },
        { status: 500 }
      );
    }

    // Determine which token source is being used
    const tokenSource = process.env.GRAZIE_TOKEN ? 'GRAZIE_TOKEN (production with NLC)' :
                       process.env.GRAZIE_DEV_TOKEN ? 'GRAZIE_DEV_TOKEN' :
                       'NEXT_PUBLIC_GRAZIE_TOKEN';

    // Log token info for debugging
    console.log('=== Token Validation ===');
    console.log('Token source:', tokenSource);
    console.log('Token length:', token.length, 'characters');
    console.log('Token first 50 chars:', token.substring(0, 50));
    console.log('Token last 50 chars:', token.substring(token.length - 50));
    console.log('=======================');

    // Map language codes to API enum format (ENGLISH/GERMAN)
    const languageMap: Record<string, string> = {
      en: 'ENGLISH',
      de: 'GERMAN',
    };

    const trimmedContext = context.trimEnd();

    // Use v3 endpoint which is confirmed working in grazie-playground
    const apiUrl = 'https://api.jetbrains.ai/user/v5/trf/nlc/complete/v3';

    // v3 API format (confirmed from grazie-playground):
    // Request: { context: string, lang: "en"|"de" }
    // Response: { completions: { prefix: string, options: string[] } }
    const requestBody = {
      context: trimmedContext,
      lang: language, // Use lowercase 'en' or 'de'
    };

    console.log('=== NLC API Request ===');
    console.log('URL:', apiUrl);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
    console.log('=====================');

    // Call the Grazie NLC API v3 with headers matching grazie-playground
    const grazieResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'grazie-authenticate-jwt': token,
        'grazie-agent': JSON.stringify({ name: 'typostry', version: '1.0.0' }),
      },
      body: JSON.stringify(requestBody),
    });

    console.log('=== NLC API Response ===');
    console.log('Status:', grazieResponse.status);
    console.log('Status Text:', grazieResponse.statusText);
    console.log('Headers:', Object.fromEntries(grazieResponse.headers.entries()));
    console.log('=======================');

    if (!grazieResponse.ok) {
      const errorText = await grazieResponse.text();
      console.error('=== API Error Response ===');
      console.error('Status:', grazieResponse.status);
      console.error('Error body:', errorText);
      console.error('Token source used:', tokenSource);
      console.error('=========================');

      // Provide more helpful error messages for 401
      if (grazieResponse.status === 401) {
        return NextResponse.json(
          {
            error: 'Authentication failed',
            details: `The ${tokenSource} token is not authorized for the NLC v4 API. Please ensure your token has NLC API access permissions. Visit https://account.jetbrains.com/ to generate a token with appropriate permissions.`,
            status: 401
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to generate completion',
          details: errorText
        },
        { status: grazieResponse.status }
      );
    }

    const data = await grazieResponse.json();
    console.log('=== API Success Response ===');
    console.log('Response data:', JSON.stringify(data, null, 2));
    console.log('===========================');

    // The v3 API returns nested structure: { completions: { prefix: string, options: string[] } }
    let result;
    if (data.completions && data.completions.prefix !== undefined && Array.isArray(data.completions.options)) {
      result = {
        prefix: data.completions.prefix,
        completions: data.completions.options
      };
      console.log('✓ Successfully parsed completions:', result.completions.length, 'suggestions');
    } else {
      console.error('✗ Unexpected response format:', data);
      return NextResponse.json(
        { error: 'Unexpected response format from completion service' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('=== NLC Completion Error ===');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'N/A');
    if (error && typeof error === 'object' && 'cause' in error) {
      console.error('Error cause:', error.cause);
    }
    console.error('===========================');
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
