import React from "react"
import { render, screen } from "@testing-library/react"

import { replaceEmojis } from "@/lib/emoji"

// Import the MarkdownPreview component to test full rendering
// Mock the MarkdownPreview component to avoid issues with remark module
jest.mock("../markdown-preview", () => ({
  MarkdownPreview: ({ source }: { source: string }) => (
    <div data-testid="markdown-preview">{source}</div>
  ),
}))

describe("Emoji Support", () => {
  test("replaceEmojis function replaces emoji codes correctly", () => {
    const input = "Hello :smile: World :heart: :thumbsup:"
    const expected = "Hello 😄 World ❤️ 👍"
    expect(replaceEmojis(input)).toBe(expected)
  })

  test("keeps original text when emoji code is not recognized", () => {
    const input = "Test with :nonexistent_emoji: code"
    const expected = "Test with :nonexistent_emoji: code"
    expect(replaceEmojis(input)).toBe(expected)
  })

  test("handles multiple emojis in a row", () => {
    const input = ":smile::heart::thumbsup:"
    const expected = "😄❤️👍"
    expect(replaceEmojis(input)).toBe(expected)
  })

  test("handles emoji codes within markdown formatting", () => {
    const input = "**Bold :smile:** and *italic :heart:*"
    const expected = "**Bold 😄** and *italic ❤️*"
    expect(replaceEmojis(input)).toBe(expected)
  })
})
