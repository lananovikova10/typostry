/**
 * Types for grammar checking functionality
 */

export interface PositionMapping {
  originalToStripped: Map<number, number>;
  strippedToOriginal: Map<number, number>;
}

export interface GrammarError {
  message: string;
  shortMessage?: string;
  offset: number;
  length: number;
  rule?: {
    id: string;
    description?: string;
    category?: {
      id: string;
      name: string;
    };
  };
  replacements: Array<{
    value: string;
  }>;
  type: 'spelling' | 'grammar';
  originalOffset: number;
  originalLength: number;
  context?: {
    text: string;
    offset: number;
    length: number;
  };
}

export interface LanguageToolResponse {
  software: {
    name: string;
    version: string;
    buildDate?: string;
    apiVersion?: number;
    status?: string;
  };
  warnings?: {
    incompleteResults?: boolean;
  };
  language: {
    name: string;
    code: string;
    detectedLanguage?: {
      name: string;
      code: string;
      confidence?: number;
    };
  };
  matches: Array<{
    message: string;
    shortMessage?: string;
    offset: number;
    length: number;
    replacements: Array<{
      value: string;
    }>;
    context: {
      text: string;
      offset: number;
      length: number;
    };
    rule: {
      id: string;
      description?: string;
      issueType?: string;
      category?: {
        id: string;
        name: string;
      };
    };
  }>;
}

export interface LanguageToolRequest {
  text: string;
  language?: string;
  enabledRules?: string | string[];
  disabledRules?: string | string[];
  level?: string;
}

export interface CustomDictionaryItem {
  word: string;
  date: string;
  ruleId?: string;
}

export interface GrammarCheckOptions {
  language?: string;
  apiUrl?: string;
  debounceTime?: number;
  disabledRules?: string[];
  useLocalStorage?: boolean;
}