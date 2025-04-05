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
const DEFAULT_LANGUAGE = "en-US";

/**
 * Format and send request to LanguageTool API
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
  
  // Prepare the request body
  const requestBody: LanguageToolRequest = {
    text,
    language,
    disabledRules: disabledRules.join(","),
  };
  
  try {
    // Send request to LanguageTool API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams(requestBody as any).toString(),
    });
    
    if (!response.ok) {
      throw new Error(`LanguageTool API error: ${response.status} ${response.statusText}`);
    }
    
    const data: LanguageToolResponse = await response.json();
    
    // Transform API response to our internal format
    return processGrammarResults(data, mapping);
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
    
    // Map error position from stripped text back to original markdown
    const originalOffset = mapStrippedToOriginal(match.offset, mapping);
    const endOffset = mapStrippedToOriginal(match.offset + match.length, mapping);
    const originalLength = endOffset - originalOffset;
    
    // Determine error type
    const type = match.rule.issueType === "misspelling" || 
                 match.rule.category?.id === "TYPOS" ||
                 match.rule.id.includes("SPELL") ? 
                 "spelling" : "grammar";
    
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
      originalOffset,
      originalLength,
      context: match.context,
    });
  }
  
  return errors;
}