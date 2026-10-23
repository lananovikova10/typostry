"use client"

import React, { useEffect, useRef, useState } from "react"

import { replaceEmojis } from "@/lib/emoji"
import { renderMarkdown } from "@/lib/markdown-pipeline"
import { cn } from "@/lib/utils"
import { useCodeBlocks } from "@/hooks/useCodeBlocks"
import { useDebouncedPreview } from "@/hooks/useDebouncedPreview"

const isBrowser = typeof window !== "undefined"

export interface MarkdownPreviewProps {
  source: string
  className?: string
  /** Debounce delay in milliseconds (default: 200ms) */
  debounceMs?: number
  /** Enable immediate local echo for better perceived performance */
  enableLocalEcho?: boolean
}

export const MarkdownPreview = React.memo(function MarkdownPreview({
  source,
  className,
  debounceMs = 200,
  enableLocalEcho = true,
}: MarkdownPreviewProps) {
  const [html, setHtml] = useState("")
  const previewRef = useRef<HTMLDivElement>(null)

  // Intelligent debouncing with local echo
  const { debouncedValue } = useDebouncedPreview(
    source,
    { debounceMs, enableLocalEcho }
  )

  // Use extracted hooks for code execution and processing
  const { processCodeBlocks, processShikiBlocks } = useCodeBlocks(previewRef)

  useEffect(() => {
    // Ignore results from a parse that finished after a newer one started
    let cancelled = false

    const parseMarkdown = async () => {
      try {
        // Replace emoji shortcodes with actual emoji characters
        const htmlContent = await renderMarkdown(replaceEmojis(debouncedValue))
        if (!cancelled) setHtml(htmlContent)
      } catch (error) {
        console.error("Error parsing markdown:", error)
        if (!cancelled) setHtml("<p>Error rendering markdown</p>")
      }
    }

    parseMarkdown()
    return () => {
      cancelled = true
    }
  }, [debouncedValue])

  // Process code blocks after the HTML has been rendered
  useEffect(() => {
    if (!isBrowser) return // Skip on server-side
    if (!html) return // Wait for HTML

    // Use setTimeout to ensure the DOM has been updated
    setTimeout(() => {
      processCodeBlocks()
    }, 0)
  }, [html, processCodeBlocks])

  // React-based code block rendering for non-JS blocks after hydration
  useEffect(() => {
    if (!isBrowser) return // Skip on server-side
    if (!html) return // Wait for HTML

    setTimeout(() => {
      processShikiBlocks()
    }, 0)
  }, [html, processShikiBlocks])

  return (
    <div
      ref={previewRef}
      className={cn(
        "prose w-full max-w-none overflow-auto rounded-md border border-[hsl(var(--markdown-input-border))] bg-[hsl(var(--markdown-input-bg))] px-6 py-4 text-[hsl(var(--markdown-input-text))] shadow-inner dark:prose-invert",
        "prose-headings:text-[hsl(var(--foreground))] prose-p:text-[hsl(var(--markdown-input-text))]",
        "prose-a:text-[hsl(var(--markdown-toolbar-active))] prose-a:no-underline hover:prose-a:underline",
        "prose-code:rounded-sm prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:text-[hsl(var(--foreground))]",
        "prose-pre:bg-muted prose-pre:shadow-sm",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
      data-testid="markdown-preview"
    />
  )
})
