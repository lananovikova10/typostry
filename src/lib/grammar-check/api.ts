/**
 * API client for LanguageTool grammar checking
 */
import { 
  GrammarError, 
  LanguageToolRequest, 
  LanguageToolResponse,
  PositionMapping
} from "./types";
import { mapStrippedToOriginal } from "./preprocessor";
import { isInDictionary } from "./dictionary";

// Default API endpoint
const DEFAULT_API_URL = "https://api.languagetool.org/v2/check";
const FALLBACK_API_URL = "https://languagetool.org/api/v2/check";
const DEFAULT_LANGUAGE = "en-US";

// Rate limiting configuration (to stay within LanguageTool API limits)
// 20 requests per minute, 75KB per minute, 20KB per request
const MAX_TEXT_LENGTH = 10000; // 10KB per request to be safe
const MIN_REQUEST_INTERVAL = 5000; // Minimum 5 seconds between requests
let lastRequestTime = 0;

/**
 * Format and send request to LanguageTool API with rate limiting
 */
export async function checkGrammar(
  text: string,
  mapping: PositionMapping,
  options: {
    language?: string;
    apiUrl?: string;
    disabledRules?: string[];
  } = {}
): Promise<GrammarError[]> {
  const { language = DEFAULT_LANGUAGE, apiUrl = DEFAULT_API_URL, disabledRules = [] } = options;

  // If text is empty, return empty array
  if (!text.trim()) {
    return [];
  }

  // Apply rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    console.log(`Rate limiting: waiting ${MIN_REQUEST_INTERVAL - timeSinceLastRequest}ms before next request`);
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();

  // Limit text length to stay within API limits
  const limitedText = text.length > MAX_TEXT_LENGTH 
    ? text.substring(0, MAX_TEXT_LENGTH) 
    : text;

  if (text.length > MAX_TEXT_LENGTH) {
    console.warn(`Text truncated from ${text.length} to ${MAX_TEXT_LENGTH} characters to comply with API limits`);
  }

  // Prepare the request body
  const requestBody: LanguageToolRequest = {
    text: limitedText,
    language: "auto",
    disabledRules: disabledRules.length > 0 ? disabledRules.join(",") : undefined,
    // Add additional parameters that might be required
    motherTongue: "en",
    preferredVariants: language,
    clientId: "typostry",
    // Lower the level to reduce API usage
    level: "default" // Changed from "picky" to reduce the number of errors returned
  };

  try {
    console.log(`Sending grammar check request (${limitedText.length} chars)...`);

    // Try the primary API endpoint
    let response;
    try {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
        },
        body: new URLSearchParams(requestBody as any).toString(),
      });
    } catch (primaryError) {
      console.error("Primary API endpoint failed:", primaryError);
      console.log("Trying fallback API endpoint...");

      // Try the fallback API endpoint
      response = await fetch(FALLBACK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
        },
        body: new URLSearchParams(requestBody as any).toString(),
      });
    }

    // Log detailed information about the response
    console.log(`API Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      // Try to get more error details from the response
      try {
        const errorData = await response.text();
        console.error(`LanguageTool API error (${response.status}): ${errorData}`);
      } catch {
        console.error(`LanguageTool API error: ${response.status} ${response.statusText}`);
      }

      if (response.status === 429 || response.status === 400) {
        console.warn("Rate limit likely exceeded. Waiting longer before next request.");
        // Increase wait time for future requests
        lastRequestTime = Date.now() + 30000; // Add 30 seconds penalty
      }

      throw new Error(`LanguageTool API error: ${response.status} ${response.statusText}`);
    }

    const data: LanguageToolResponse = await response.json();

    // Check if the response contains matches
    if (!data.matches || data.matches.length === 0) {
      console.log("No grammar errors found in the text");
    } else {
      console.log(`Found ${data.matches.length} grammar errors`);
    }

    // Transform API response to our internal format
    const results = processGrammarResults(data, mapping);
    console.log(`Processed ${results.length} grammar results`);
    return results;
  } catch (error) {
    console.error("Grammar check failed:", error);
    return [];
  }
}

/**
 * Process LanguageTool API response into our internal format
 */
function processGrammarResults(
  response: LanguageToolResponse,
  mapping: PositionMapping
): GrammarError[] {
  const errors: GrammarError[] = [];

  // Define the placeholder character used for images
  const IMAGE_PLACEHOLDER = '⁂';

  for (const match of response.matches) {
    // Skip errors for words in custom dictionary
    if (isInDictionary(
      match.context.text.substring(
        match.context.offset, 
        match.context.offset + match.context.length
      ),
      match.rule.id
    )) {
      continue;
    }

    // Skip errors that involve our image placeholder character
    const errorText = match.context.text.substring(
      match.context.offset, 
      match.context.offset + match.context.length
    );
    if (errorText.includes(IMAGE_PLACEHOLDER)) {
      continue;
    }

    // Map error position from stripped text back to original markdown
    const originalOffset = mapStrippedToOriginal(match.offset, mapping);
    const endOffset = mapStrippedToOriginal(match.offset + match.length, mapping);
    const originalLength = endOffset - originalOffset;

    // Determine error type
    const type = match.rule.issueType === "misspelling" || 
                 match.rule.category?.id === "TYPOS" ||
                 match.rule.id.includes("SPELL") ? 
                 "spelling" : "grammar";

    // Determine error severity based on rule properties
    let severity: 'low' | 'medium' | 'high' = 'medium'; // Default to medium

    // Rules for determining severity
    if (type === "spelling") {
      // Spelling errors are generally high severity
      severity = 'high';
    } else if (match.rule.id.includes("STYLE") || match.rule.category?.id === "STYLE") {
      // Style issues are low severity
      severity = 'low';
    } else if (match.rule.id.includes("PUNCTUATION") || match.rule.category?.id === "PUNCTUATION") {
      // Punctuation issues are medium severity
      severity = 'medium';
    } else if (match.rule.id.includes("GRAMMAR") || match.rule.category?.id === "GRAMMAR") {
      // Grammar issues are high severity
      severity = 'high';
    }

    errors.push({
      message: match.message,
      shortMessage: match.shortMessage,
      offset: match.offset,
      length: match.length,
      rule: {
        id: match.rule.id,
        description: match.rule.description,
        category: match.rule.category,
      },
      replacements: match.replacements,
      type,
      severity,
      originalOffset,
      originalLength,
      context: match.context,
    });
  }

  return errors;
}
