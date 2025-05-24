import { calculateReadingStats } from "../index";

describe("calculateReadingStats", () => {
  it("handles empty text", () => {
    const result = calculateReadingStats("");
    expect(result).toEqual({
      readingTime: 0,
      wordCount: 0,
      characterCount: 0
    });
  });

  it("calculates stats for short text", () => {
    // 10 words, 50 characters
    const text = "This is a short text with exactly ten words total.";
    const result = calculateReadingStats(text);
    
    expect(result).toEqual({
      readingTime: 1, // Minimum 1 minute
      wordCount: 10,
      characterCount: 50
    });
  });

  it("calculates stats for longer text", () => {
    // Create text with 400 words (using a repeated phrase)
    const phrase = "Lorem ipsum dolor sit amet. ";
    const wordCount = 5;
    const repetitions = 80; // 5 words * 80 = 400 words
    const text = phrase.repeat(repetitions);
    
    const result = calculateReadingStats(text);
    
    expect(result).toEqual({
      readingTime: 2, // 400 words at 200 wpm = 2 minutes
      wordCount: wordCount * repetitions,
      characterCount: text.length
    });
  });

  it("respects custom words per minute", () => {
    // Create text with 300 words
    const phrase = "Lorem ipsum dolor sit amet. ";
    const repetitions = 60; // 5 words * 60 = 300 words
    const text = phrase.repeat(repetitions);
    
    // With 150 wpm, 300 words should take 2 minutes
    const result = calculateReadingStats(text, 150);
    
    expect(result.readingTime).toBe(2);
  });
});