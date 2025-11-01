/**
 * Sanitization schema for rehype-sanitize
 * Allowlists KaTeX elements and code blocks while preventing XSS attacks
 */

import { defaultSchema } from "rehype-sanitize"
import type { Options } from "rehype-sanitize"

/**
 * Custom sanitization schema that extends the default schema
 * to support KaTeX math rendering and code blocks
 */
export const markdownSanitizeSchema: Options = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // Allow class names for styling (needed for KaTeX, code blocks, and GFM)
    "*": [
      ...(defaultSchema.attributes?.["*"] || []),
      "className",
      "class",
      "id", // For heading navigation
    ],
    // KaTeX specific attributes
    span: [
      ...(defaultSchema.attributes?.span || []),
      "className",
      "class",
      "style", // KaTeX uses inline styles
      "aria-hidden",
    ],
    // SVG elements for KaTeX
    svg: [
      ...(defaultSchema.attributes?.svg || []),
      "xmlns",
      "width",
      "height",
      "viewBox",
      "style",
      "className",
      "class",
      "aria-hidden",
      "focusable",
    ],
    path: [
      ...(defaultSchema.attributes?.path || []),
      "d",
      "style",
      "className",
      "class",
    ],
    // Code blocks
    pre: [
      ...(defaultSchema.attributes?.pre || []),
      "className",
      "class",
      "data-language",
      "data-theme",
    ],
    code: [
      ...(defaultSchema.attributes?.code || []),
      "className",
      "class",
      "data-language",
    ],
    // Tables (for GFM)
    table: [
      ...(defaultSchema.attributes?.table || []),
      "className",
      "class",
    ],
    thead: [
      ...(defaultSchema.attributes?.thead || []),
      "className",
      "class",
    ],
    tbody: [
      ...(defaultSchema.attributes?.tbody || []),
      "className",
      "class",
    ],
    tr: [
      ...(defaultSchema.attributes?.tr || []),
      "className",
      "class",
    ],
    th: [
      ...(defaultSchema.attributes?.th || []),
      "className",
      "class",
      "align",
    ],
    td: [
      ...(defaultSchema.attributes?.td || []),
      "className",
      "class",
      "align",
    ],
    // Task lists (for GFM)
    input: [
      ...(defaultSchema.attributes?.input || []),
      "type",
      "checked",
      "disabled",
      "className",
      "class",
    ],
    // Images
    img: [
      ...(defaultSchema.attributes?.img || []),
      "src",
      "alt",
      "title",
      "width",
      "height",
      "className",
      "class",
    ],
    // Links
    a: [
      ...(defaultSchema.attributes?.a || []),
      "href",
      "title",
      "target",
      "rel",
      "className",
      "class",
    ],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    // KaTeX elements
    "math",
    "semantics",
    "mrow",
    "mi",
    "mn",
    "mo",
    "mtext",
    "mspace",
    "annotation",
    "svg",
    "path",
    "g",
    "use",
    "defs",
    "clipPath",
    "rect",
    "line",
    "circle",
    "ellipse",
    "polygon",
    "polyline",
    // Standard HTML elements
    "span",
    "div",
    "p",
    "br",
    "hr",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "strong",
    "em",
    "code",
    "pre",
    "blockquote",
    "ul",
    "ol",
    "li",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "a",
    "img",
    "input",
    "del",
    "ins",
    "sup",
    "sub",
  ],
  // Explicitly strip dangerous protocols
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto", "#"],
    src: ["http", "https"],
    cite: ["http", "https"],
  },
  // Strip event handlers and dangerous attributes
  strip: ["script", "style"],
}
