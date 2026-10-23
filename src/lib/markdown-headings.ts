import { replaceEmojis } from "./emoji"

export interface MarkdownHeading {
  text: string
  level: number
  id: string
  /** Character offset of the heading line in the source markdown */
  offset: number
}

/**
 * Converts heading text into a URL-friendly id.
 * Shared by the preview renderer and the outline so ids always match.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen
}

/**
 * Returns a slug function that de-duplicates ids within one document
 * ("intro", "intro-1", "intro-2", ...).
 */
export function createSlugger() {
  const seen = new Map<string, number>()
  return (text: string): string => {
    const base = slugify(text)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    return count === 0 ? base : `${base}-${count}`
  }
}

/**
 * Approximates the rendered text of an inline markdown heading so that its
 * slug matches the one produced from the rendered HTML.
 */
function headingPlainText(text: string): string {
  return replaceEmojis(text)
    .replace(/\s+#+\s*$/, "") // Closing ATX hashes: "## Title ##"
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1") // Links and images
    .replace(/(\*{1,3}|_{1,3})(\S(?:.*?\S)?)\1/g, "$2") // Emphasis
    .replace(/`([^`]*)`/g, "$1") // Inline code
}

/**
 * Extracts ATX headings from markdown, skipping fenced code blocks.
 */
export function extractHeadings(markdown: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = []
  const slug = createSlugger()
  let fence: string | null = null
  let offset = 0

  for (const line of markdown.split("\n")) {
    const fenceMatch = line.match(/^\s{0,3}(`{3,}|~{3,})/)
    if (fenceMatch) {
      const marker = fenceMatch[1]
      if (fence === null) {
        fence = marker
      } else if (marker[0] === fence[0] && marker.length >= fence.length) {
        fence = null
      }
    } else if (fence === null) {
      const match = line.match(/^ {0,3}(#{1,6})\s+(.+?)\s*$/)
      if (match) {
        const text = match[2].replace(/\s+#+$/, "")
        headings.push({
          text,
          level: match[1].length,
          id: slug(headingPlainText(text)),
          offset,
        })
      }
    }
    offset += line.length + 1
  }

  return headings
}
