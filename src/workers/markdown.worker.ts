/**
 * Web Worker for processing markdown content
 * Handles heavy markdown parsing operations off the main thread
 */

import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkRehype from "remark-rehype"
import rehypeKatex from "rehype-katex"
import rehypeStringify from "rehype-stringify"

export interface MarkdownWorkerMessage {
  id: string
  type: "parse" | "cancel"
  content?: string
}

export interface MarkdownWorkerResponse {
  id: string
  type: "success" | "error"
  html?: string
  error?: string
}

// Track current processing job
let currentJobId: string | null = null

// Handle messages from the main thread
self.addEventListener("message", async (event: MessageEvent<MarkdownWorkerMessage>) => {
  const { id, type, content } = event.data

  if (type === "cancel") {
    // Cancel current job
    currentJobId = null
    return
  }

  if (type === "parse" && content !== undefined) {
    // Set current job
    currentJobId = id

    try {
      // Process markdown content with math support
      const result = await unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkMath)
        .use(remarkRehype)
        .use(rehypeKatex)
        .use(rehypeStringify)
        .process(content)

      // Check if job was cancelled
      if (currentJobId !== id) {
        return
      }

      let htmlContent = result.toString()

      // Add IDs to headings for navigation
      htmlContent = htmlContent.replace(
        /<(h[1-6])>(.*?)<\/h[1-6]>/g,
        (match, tag, content) => {
          const id = content
            .toLowerCase()
            .replace(/<\/?[^>]+(>|$)/g, "") // Remove HTML tags
            .replace(/[^\w\s-]/g, "") // Remove special chars
            .replace(/\s+/g, "-") // Replace spaces with hyphens
            .replace(/--+/g, "-") // Replace multiple hyphens

          return `<${tag} id="${id}">${content}</${tag}>`
        }
      )

      // Send success response
      const response: MarkdownWorkerResponse = {
        id,
        type: "success",
        html: htmlContent,
      }

      self.postMessage(response)
    } catch (error) {
      // Check if job was cancelled
      if (currentJobId !== id) {
        return
      }

      // Send error response
      const response: MarkdownWorkerResponse = {
        id,
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      }

      self.postMessage(response)
    } finally {
      // Clear current job if it matches
      if (currentJobId === id) {
        currentJobId = null
      }
    }
  }
})

// Export empty object to make this a module
export {}
