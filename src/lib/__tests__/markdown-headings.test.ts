import { createSlugger, extractHeadings, slugify } from "../markdown-headings"
import { replaceEmojis } from "../emoji"
import { renderMarkdown } from "../markdown-pipeline"

describe("slugify", () => {
  it("lowercases, strips punctuation and joins words with hyphens", () => {
    expect(slugify("What's New?")).toBe("whats-new")
    expect(slugify("Tom & Jerry")).toBe("tom-jerry")
  })
})

describe("createSlugger", () => {
  it("de-duplicates repeated headings", () => {
    const slug = createSlugger()
    expect(slug("Intro")).toBe("intro")
    expect(slug("Intro")).toBe("intro-1")
    expect(slug("Intro")).toBe("intro-2")
  })

  it("never reuses an id, even for headings that look like suffixes", () => {
    const slug = createSlugger()
    expect([slug("Intro"), slug("Intro"), slug("Intro-1")]).toEqual([
      "intro",
      "intro-1",
      "intro-1-1",
    ])

    const reversed = createSlugger()
    expect([reversed("Intro"), reversed("Intro-1"), reversed("Intro")]).toEqual([
      "intro",
      "intro-1",
      "intro-2",
    ])
  })
})

describe("extractHeadings", () => {
  it("returns sibling headings with their level and offset", () => {
    const markdown = "## One\ntext\n## Two\n### Three"
    expect(extractHeadings(markdown)).toEqual([
      { text: "One", level: 2, id: "one", offset: 0 },
      { text: "Two", level: 2, id: "two", offset: 12 },
      { text: "Three", level: 3, id: "three", offset: 19 },
    ])
  })

  it("treats a fence line with trailing text as code, not a closing fence", () => {
    const markdown = "```\n```js\n# not a heading\n```\n\n# After"
    expect(extractHeadings(markdown).map((h) => h.text)).toEqual(["After"])
  })

  it("finds Setext headings and headings inside blockquotes", () => {
    const markdown = "Title\n=====\n\n> ## Quoted\n\nSub\n---"
    expect(
      extractHeadings(markdown).map((h) => [h.text, h.level])
    ).toEqual([
      ["Title", 1],
      ["Quoted", 2],
      ["Sub", 2],
    ])
  })

  it("ignores '#' lines inside fenced code blocks", () => {
    const markdown = "# Title\n```bash\n# not a heading\n```\n## Real"
    expect(extractHeadings(markdown).map((h) => h.text)).toEqual([
      "Title",
      "Real",
    ])
  })
})

describe("heading ids", () => {
  it("match between the rendered preview and the outline", async () => {
    const markdown = [
      "# Tom & Jerry",
      "## What's **new**?",
      "## [Docs](https://example.com) `api`",
      "## Intro",
      "## Intro",
      "Intro\n=====",
      "## Fish &amp; chips",
      "## Smile :smile: ![logo](x.png)",
    ].join("\n\n")

    // Same steps as the preview: emoji shortcodes first, then render
    const html = await renderMarkdown(replaceEmojis(markdown))
    const renderedIds = Array.from(html.matchAll(/<h[1-6] id="([^"]*)"/g)).map(
      (match) => match[1]
    )

    expect(renderedIds).toEqual(extractHeadings(markdown).map((h) => h.id))
    expect(renderedIds).toEqual([
      "tom-jerry",
      "whats-new",
      "docs-api",
      "intro",
      "intro-1",
      "intro-2",
      "fish-chips",
      "smile",
    ])
  })
})
