/**
 * Calculates reading statistics for text content
 * 
 * @param text The text content to analyze
 * @param wordsPerMinute Average reading speed in words per minute (default: 200)
 * @returns Object containing reading time, word count, and character count
 */
export function calculateReadingStats(text: string, wordsPerMinute: number = 200) {
  // Handle empty content
  if (!text || text.trim() === '') {
    return {
      readingTime: 0,
      wordCount: 0,
      characterCount: 0
    };
  }

  // Character count is simply the length of the string
  const characterCount = text.length;

  // Split text by whitespace to count words
  // This regular expression matches any whitespace character (spaces, tabs, line breaks)
  const words = text.trim().split(/\s+/);
  const wordCount = words.length;

  // Calculate reading time in minutes
  // Use Math.max to ensure at least 1 minute for very short texts
  // Use Math.ceil to round up to the nearest minute
  const readingTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));

  return {
    readingTime,
    wordCount,
    characterCount
  };
}