import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"

import { replaceEmojis } from "./emoji"

export interface MarkdownHeading {
  text: string
  level: number
  id: string
  /** Character offset of the heading in the source markdown */
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
    .replace(/^-+|-+$/g, "") // Trim hyphens left by stripped characters
}

/**
 * Returns a slug function that gives every heading in one document a unique
 * id ("intro", "intro-1", "intro-2", ...). Generated suffixes are reserved
 * too, so a heading literally named "Intro 1" can't collide with them.
 */
export function createSlugger() {
  const used = new Set<string>()
  const nextSuffix = new Map<string, number>()
  return (text: string): string => {
    const base = slugify(text)
    let id = base
    let suffix = nextSuffix.get(base) ?? 0
    while (used.has(id)) {
      suffix += 1
      id = `${base}-${suffix}`
    }
    nextSuffix.set(base, suffix)
    used.add(id)
    return id
  }
}

// Minimal mdast shape, enough to walk the tree without extra type packages
interface MdastNode {
  type: string
  depth?: number
  value?: string
  children?: MdastNode[]
  position?: { start: { offset?: number } }
}

// Same parse options as the renderer (see markdown-pipeline.ts), so headings
// are found under the same rules: Setext headings, fences, math blocks, etc.
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath)

// Mirrors the rendered heading's text content: images and raw HTML render no
// text, while code and math keep their source text
function plainText(node: MdastNode): string {
  switch (node.type) {
    case "text":
    case "inlineCode":
    case "inlineMath":
      return node.value ?? ""
    case "image":
    case "imageReference":
    case "html":
      return ""
    default:
      return (node.children ?? []).map(plainText).join("")
  }
}

/**
 * Extracts headings from markdown in document order, with the same ids the
 * preview renderer assigns.
 */
export function extractHeadings(markdown: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = []
  const slug = createSlugger()

  const visit = (node: MdastNode) => {
    if (node.type === "heading") {
      // The preview replaces emoji shortcodes before rendering
      const text = replaceEmojis(plainText(node)).trim()
      headings.push({
        text,
        level: node.depth ?? 1,
        id: slug(text),
        offset: node.position?.start.offset ?? 0,
      })
      return
    }
    node.children?.forEach(visit)
  }
  visit(parser.parse(markdown) as MdastNode)

  return headings
}
