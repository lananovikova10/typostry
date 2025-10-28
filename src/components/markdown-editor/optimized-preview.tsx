"use client"

import React, { useEffect, useRef } from "react"
import { useTheme } from "next-themes"

import { replaceEmojis } from "@/lib/emoji"
import { cn } from "@/lib/utils"
import { useMarkdownWorker } from "@/hooks/useMarkdownWorker"
import { useCodeExecution } from "@/hooks/useCodeExecution"
import { useCodeBlocks } from "@/hooks/useCodeBlocks"

const isBrowser = typeof window !== "undefined"

export interface OptimizedPreviewProps {
  source: string
  className?: string
  useVirtualScrolling?: boolean
  debounceMs?: number
}

/**
 * Optimized markdown preview with:
 * - Debounced rendering
 * - Web Worker for heavy processing
 * - Lazy code highlighting
 * - Memoized rendering
 */
export function OptimizedPreview({
  source,
  className,
  useVirtualScrolling = false,
  debounceMs = 300,
}: OptimizedPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const { theme, resolvedTheme } = useTheme()
  const { html, isProcessing, error, processMarkdown } = useMarkdownWorker()

  // Use extracted hooks for code execution and processing
  const { executeJavaScript } = useCodeExecution()
  const { processCodeBlocks, processShikiBlocks } = useCodeBlocks({
    previewRef,
    executeJavaScript,
  })

  // Process markdown with debouncing and worker
  useEffect(() => {
    if (!isBrowser) return

    // Replace emoji shortcodes first
    const processedSource = replaceEmojis(source)

    // Process in worker with debouncing
    processMarkdown(processedSource, debounceMs)
  }, [source, debounceMs, processMarkdown])

  // Process code blocks after HTML is ready
  useEffect(() => {
    if (!isBrowser || !html) return

    setTimeout(() => {
      processCodeBlocks()
    }, 0)
  }, [html, processCodeBlocks])

  // Highlight code with Shiki
  useEffect(() => {
    if (!isBrowser || !html) return

    setTimeout(() => {
      processShikiBlocks()
    }, 0)
  }, [html, processShikiBlocks])

  if (error) {
    return (
      <div
        className={cn(
          "prose w-full max-w-none overflow-auto rounded-md border border-[hsl(var(--markdown-input-border))] bg-[hsl(var(--markdown-input-bg))] px-6 py-4 text-[hsl(var(--markdown-input-text))] shadow-inner dark:prose-invert",
          className
        )}
      >
        <p className="text-red-500">Error: {error}</p>
      </div>
    )
  }

  return (
    <div
      ref={previewRef}
      className={cn(
        "prose w-full max-w-none overflow-auto rounded-md border border-[hsl(var(--markdown-input-border))] bg-[hsl(var(--markdown-input-bg))] px-6 py-4 text-[hsl(var(--markdown-input-text))] shadow-inner dark:prose-invert",
        "prose-headings:text-[hsl(var(--foreground))] prose-p:text-[hsl(var(--markdown-input-text))]",
        "prose-a:text-[hsl(var(--markdown-toolbar-active))] prose-a:no-underline hover:prose-a:underline",
        "prose-code:rounded-sm prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:text-[hsl(var(--foreground))]",
        "prose-pre:bg-muted prose-pre:shadow-sm",
        isProcessing && "opacity-70",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
      data-testid="optimized-markdown-preview"
    />
  )
}