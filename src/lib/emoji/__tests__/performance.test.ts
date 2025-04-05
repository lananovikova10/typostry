import { replaceEmojis } from '../index';

describe('Emoji Performance Tests', () => {
  test('performs well with large documents containing many emoji codes', () => {
    // Create a large document with many emoji codes
    const emojiCodes = [':smile:', ':heart:', ':thumbsup:', ':dog:', ':cat:', ':rocket:'];
    let largeText = '';
    
    // Create a document with 1000 emoji codes mixed with text
    for (let i = 0; i < 1000; i++) {
      const randomEmoji = emojiCodes[Math.floor(Math.random() * emojiCodes.length)];
      largeText += `This is paragraph ${i} with ${randomEmoji} and some more text. `;
      
      // Add some consecutive emojis every 10 paragraphs
      if (i % 10 === 0) {
        largeText += ':smile::heart::thumbsup: ';
      }
    }
    
    // Measure performance
    const start = performance.now();
    const result = replaceEmojis(largeText);
    const end = performance.now();
    const duration = end - start;
    
    // This performance threshold might need to be adjusted based on your environment
    expect(duration).toBeLessThan(500); // Should process in less than 500ms
    
    // Verify some key replacements were made
    expect(result).toContain('😄');
    expect(result).toContain('❤️');
    expect(result).toContain('👍');
    expect(result).not.toContain(':smile:');
    expect(result).not.toContain(':heart:');
    expect(result).not.toContain(':thumbsup:');
  });
  
  test('handles mixed emoji and markdown formatting without issues', () => {
    // Create a complex document with mixed content
    const complexText = `
# Heading with :smile: emoji

## Subheading with :heart: emoji

This is a paragraph with :thumbsup: emoji and **bold text with :heart: emoji** and *italic text with :smile: emoji*.

* List item with :dog: emoji
* List item with :cat: emoji
* List item with :rocket: emoji

> Blockquote with :thumbsup: emoji

\`\`\`javascript
// Code block with :smile: emoji
console.log("Hello, world!");
\`\`\`

[Link with :heart: emoji](https://example.com)

| Table | with | :smile: | emoji |
|-------|------|---------|-------|
| Cell  | with | :heart: | emoji |

Lorem ipsum :nonexistent_emoji: dolor sit amet.

:smile::heart::thumbsup::dog::cat::rocket:
`;

    const result = replaceEmojis(complexText);
    
    // Verify formatting is preserved
    expect(result).toContain('# Heading with 😄 emoji');
    expect(result).toContain('## Subheading with ❤️ emoji');
    expect(result).toContain('**bold text with ❤️ emoji**');
    expect(result).toContain('*italic text with 😄 emoji*');
    expect(result).toContain('* List item with 🐶 emoji');
    expect(result).toContain('> Blockquote with 👍 emoji');
    expect(result).toContain('```javascript\n// Code block with 😄 emoji');
    expect(result).toContain('[Link with ❤️ emoji](https://example.com)');
    expect(result).toContain('| Table | with | 😄 | emoji |');
    
    // Verify unrecognized emoji codes remain untouched
    expect(result).toContain(':nonexistent_emoji:');
    
    // Verify consecutive emojis
    expect(result).toContain('😄❤️👍🐶🐱🚀');
  });
});