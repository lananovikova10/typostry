import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkRehype from "remark-rehype"
import rehypeSanitize from "rehype-sanitize"
import rehypeKatex from "rehype-katex"
import rehypeStringify from "rehype-stringify"

import { createSlugger } from "./markdown-headings"
import { markdownSanitizeSchema } from "./sanitize-schema"

// Minimal hast shape, enough to walk the tree without extra type packages
interface HastNode {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

function textContent(node: HastNode): string {
  if (node.type === "text") return node.value ?? ""
  return (node.children ?? []).map(textContent).join("")
}

/**
 * Adds de-duplicated ids to headings, using the same slug rules as the
 * document outline (see extractHeadings).
 */
function rehypeHeadingIds() {
  return (tree: HastNode) => {
    const slug = createSlugger()
    const visit = (node: HastNode) => {
      if (node.type === "element" && /^h[1-6]$/.test(node.tagName ?? "")) {
        node.properties = { ...node.properties, id: slug(textContent(node)) }
        return
      }
      node.children?.forEach(visit)
    }
    visit(tree)
  }
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeSanitize, markdownSanitizeSchema)
  .use(rehypeHeadingIds)
  .use(rehypeKatex)
  .use(rehypeStringify)

/**
 * Renders markdown (GFM + math) to sanitized HTML with heading ids.
 * Emoji shortcodes are expected to be replaced by the caller.
 */
export async function renderMarkdown(source: string): Promise<string> {
  const result = await processor.process(source)
  return result.toString()
}
