/**
 * NLC (Natural Language Completion) API client
 * Based on JetBrains Grazie platform
 */

export interface CompletionOptions {
  context: string;
  language: 'en' | 'de';
  profile?: 'Always' | 'Moderate';
}

export interface CompletionResult {
  prefix: string;
  completions: string[];
}

/**
 * Rate limiting state
 */
const requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_MINUTE = 20;
const REQUEST_INTERVAL = 60000; // 1 minute in milliseconds

/**
 * Check if we can make a request within rate limits
 */
function canMakeRequest(): boolean {
  const now = Date.now();
  // Remove timestamps older than 1 minute
  while (requestTimestamps.length > 0 && now - requestTimestamps[0]! > REQUEST_INTERVAL) {
    requestTimestamps.shift();
  }
  return requestTimestamps.length < MAX_REQUESTS_PER_MINUTE;
}

/**
 * Record a request timestamp
 */
function recordRequest(): void {
  requestTimestamps.push(Date.now());
}

/**
 * Generate text completion suggestions using the NLC service
 * @param options - Completion options including context, language, and profile
 * @returns Promise with completion results
 */
export async function completeText(
  options: CompletionOptions
): Promise<CompletionResult> {
  const { context, language, profile = 'Moderate' } = options;

  // Validate input
  if (!context || context.trim().length === 0) {
    throw new Error('Context cannot be empty');
  }

  // Check rate limiting
  if (!canMakeRequest()) {
    throw new Error('Rate limit exceeded. Please try again in a moment.');
  }

  try {
    recordRequest();

    const response = await fetch('/api/nlc/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context: context.trimEnd(), // Remove trailing spaces as per spec
        language,
        profile,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`NLC API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data || typeof data.prefix !== 'string' || !Array.isArray(data.completions)) {
      throw new Error('Invalid response format from NLC API');
    }

    return data as CompletionResult;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to generate text completion');
  }
}

/**
 * Extract the last partial word from context for completion
 * This helps determine what we're completing
 */
export function getCompletionPrefix(text: string): string {
  const trimmed = text.trimEnd();
  const lastSpace = Math.max(
    trimmed.lastIndexOf(' '),
    trimmed.lastIndexOf('\n'),
    trimmed.lastIndexOf('\t')
  );
  return trimmed.substring(lastSpace + 1);
}

/**
 * Check if context is suitable for completion
 * Avoid triggering completion in code blocks, URLs, etc.
 */
export function shouldTriggerCompletion(context: string, cursorPosition: number): boolean {
  // Don't complete if at the start
  if (cursorPosition === 0) {
    return false;
  }

  // Get text up to cursor
  const textBeforeCursor = context.substring(0, cursorPosition);

  // Don't complete inside code blocks
  const codeBlockCount = (textBeforeCursor.match(/```/g) || []).length;
  if (codeBlockCount % 2 === 1) {
    return false;
  }

  // Don't complete inside inline code
  const inlineCodeCount = (textBeforeCursor.match(/`/g) || []).length;
  if (inlineCodeCount % 2 === 1) {
    return false;
  }

  // Don't complete inside URLs
  const lastWord = getCompletionPrefix(textBeforeCursor);
  if (lastWord.startsWith('http://') || lastWord.startsWith('https://') || lastWord.includes('://')) {
    return false;
  }

  // Don't complete if just started a new line without any text
  if (textBeforeCursor.endsWith('\n') || textBeforeCursor.endsWith('\n\n')) {
    return false;
  }

  // Must have at least some text to complete
  const prefix = getCompletionPrefix(textBeforeCursor);
  if (prefix.length < 2) {
    return false;
  }

  return true;
}
