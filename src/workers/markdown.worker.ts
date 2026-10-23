/**
 * Web Worker for processing markdown content
 * Handles heavy markdown parsing operations off the main thread
 */

import { renderMarkdown } from "../lib/markdown-pipeline"

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
      // Process markdown content with math support and sanitization
      const htmlContent = await renderMarkdown(content)

      // Check if job was cancelled
      if (currentJobId !== id) {
        return
      }

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
