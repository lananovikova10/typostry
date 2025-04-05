/**
 * Custom dictionary management for grammar checker
 */
import { CustomDictionaryItem } from "./types";

const STORAGE_KEY = "markdown-editor-custom-dictionary";

/**
 * Load custom dictionary from localStorage
 */
export function loadCustomDictionary(): CustomDictionaryItem[] {
  if (typeof window === "undefined") {
    return [];
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load custom dictionary", error);
  }
  
  return [];
}

/**
 * Save custom dictionary to localStorage
 */
export function saveCustomDictionary(dictionary: CustomDictionaryItem[]): void {
  if (typeof window === "undefined") {
    return;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dictionary));
  } catch (error) {
    console.error("Failed to save custom dictionary", error);
  }
}

/**
 * Add a word to the custom dictionary
 */
export function addToDictionary(
  word: string,
  ruleId?: string
): CustomDictionaryItem[] {
  const dictionary = loadCustomDictionary();
  
  // Check if word already exists
  const exists = dictionary.some(
    (item) => 
      item.word.toLowerCase() === word.toLowerCase() && 
      (!ruleId || item.ruleId === ruleId)
  );
  
  if (!exists) {
    const newItem: CustomDictionaryItem = {
      word,
      date: new Date().toISOString(),
      ruleId,
    };
    
    dictionary.push(newItem);
    saveCustomDictionary(dictionary);
  }
  
  return dictionary;
}

/**
 * Remove a word from the custom dictionary
 */
export function removeFromDictionary(
  word: string,
  ruleId?: string
): CustomDictionaryItem[] {
  const dictionary = loadCustomDictionary();
  
  const filtered = dictionary.filter(
    (item) => 
      !(item.word.toLowerCase() === word.toLowerCase() && 
      (!ruleId || item.ruleId === ruleId))
  );
  
  if (filtered.length !== dictionary.length) {
    saveCustomDictionary(filtered);
  }
  
  return filtered;
}

/**
 * Check if a word is in the custom dictionary
 */
export function isInDictionary(
  word: string,
  ruleId?: string
): boolean {
  const dictionary = loadCustomDictionary();
  
  return dictionary.some(
    (item) => 
      item.word.toLowerCase() === word.toLowerCase() && 
      (!ruleId || item.ruleId === ruleId)
  );
}

/**
 * Clear the entire custom dictionary
 */
export function clearDictionary(): void {
  if (typeof window === "undefined") {
    return;
  }
  
  localStorage.removeItem(STORAGE_KEY);
}