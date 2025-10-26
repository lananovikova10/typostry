"use client"

import { useEffect, useState } from "react"

import { OptimizedPreview } from "./optimized-preview"
import { VirtualizedPreview } from "./virtualized-preview"
import { useMarkdownWorker } from "@/hooks/useMarkdownWorker"

/**
 * Example component demonstrating performance optimizations
 * This shows how to choose between different preview components
 * based on document size
 */
export function PerformanceExample() {
  const [markdown, setMarkdown] = useState("")
  const [previewMode, setPreviewMode] = useState<"standard" | "optimized" | "virtualized">("optimized")
  const { html, isProcessing, processMarkdown } = useMarkdownWorker()

  // Automatically switch preview mode based on document size
  useEffect(() => {
    const lines = markdown.split("\n").length

    if (lines < 1000) {
      setPreviewMode("standard")
    } else if (lines < 5000) {
      setPreviewMode("optimized")
    } else {
      setPreviewMode("virtualized")
    }
  }, [markdown])

  // Process markdown with worker when in virtualized mode
  useEffect(() => {
    if (previewMode === "virtualized") {
      processMarkdown(markdown, 500)
    }
  }, [markdown, previewMode, processMarkdown])

  const stats = {
    lines: markdown.split("\n").length,
    characters: markdown.length,
    words: markdown.trim().split(/\s+/).filter(Boolean).length,
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Stats Bar */}
      <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2 text-sm">
        <div className="flex gap-4">
          <span>Lines: {stats.lines.toLocaleString()}</span>
          <span>Words: {stats.words.toLocaleString()}</span>
          <span>Characters: {stats.characters.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Preview Mode:</span>
          <span className="font-medium capitalize">{previewMode}</span>
          {isProcessing && (
            <span className="ml-2 text-xs text-muted-foreground">Processing...</span>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 border-r p-4">
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="h-full w-full resize-none rounded-md border bg-background p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Start typing markdown here...

Try pasting a large document (> 5000 lines) to see virtual scrolling in action!"
          />
        </div>

        {/* Preview */}
        <div className="flex-1 p-4">
          {previewMode === "virtualized" ? (
            <VirtualizedPreview htmlContent={html} />
          ) : (
            <OptimizedPreview
              source={markdown}
              debounceMs={previewMode === "optimized" ? 300 : 0}
            />
          )}
        </div>
      </div>
    </div>
  )
}
