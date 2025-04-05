import { replaceEmojis, emojiMap } from '../index';

describe('Emoji Support', () => {
  test('replaceEmojis function replaces emoji codes correctly', () => {
    const input = 'Hello :smile: World :heart: :thumbsup:';
    const expected = 'Hello 😄 World ❤️ 👍';
    expect(replaceEmojis(input)).toBe(expected);
  });

  test('keeps original text when emoji code is not recognized', () => {
    const input = 'Test with :nonexistent_emoji: code';
    const expected = 'Test with :nonexistent_emoji: code';
    expect(replaceEmojis(input)).toBe(expected);
  });

  test('handles multiple emojis in a row', () => {
    const input = ':smile::heart::thumbsup:';
    const expected = '😄❤️👍';
    expect(replaceEmojis(input)).toBe(expected);
  });

  test('handles emoji codes within markdown formatting', () => {
    const input = '**Bold :smile:** and *italic :heart:*';
    const expected = '**Bold 😄** and *italic ❤️*';
    expect(replaceEmojis(input)).toBe(expected);
  });

  test('handles emoji codes within links', () => {
    const input = '[Link with :smile: emoji](https://example.com)';
    const expected = '[Link with 😄 emoji](https://example.com)';
    expect(replaceEmojis(input)).toBe(expected);
  });

  test('handles emoji codes in code blocks', () => {
    const input = '```\nCode block with :smile: emoji\n```';
    const expected = '```\nCode block with 😄 emoji\n```';
    expect(replaceEmojis(input)).toBe(expected);
  });

  test('handles emoji codes in headings', () => {
    const input = '# Heading with :smile: emoji';
    const expected = '# Heading with 😄 emoji';
    expect(replaceEmojis(input)).toBe(expected);
  });

  test('handles emoji codes in lists', () => {
    const input = '- Item with :smile: emoji\n- Another :heart: item';
    const expected = '- Item with 😄 emoji\n- Another ❤️ item';
    expect(replaceEmojis(input)).toBe(expected);
  });

  test('handles emoji codes with special characters around them', () => {
    const input = 'Special:smile:chars';
    // The updated regex also matches emoji codes within text without spaces
    const expected = 'Special😄chars';
    expect(replaceEmojis(input)).toBe(expected);
  });

  test('emojiMap contains essential emoji entries', () => {
    // Check that some common emoji codes are defined
    expect(emojiMap).toHaveProperty('smile');
    expect(emojiMap).toHaveProperty('heart');
    expect(emojiMap).toHaveProperty('thumbsup');
    expect(emojiMap).toHaveProperty('+1');
    expect(emojiMap).toHaveProperty('-1');
  });
});