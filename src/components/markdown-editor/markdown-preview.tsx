"use client"

import React, { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkRehype from "remark-rehype"
import rehypeKatex from "rehype-katex"
import rehypeStringify from "rehype-stringify"

import { replaceEmojis } from "@/lib/emoji"
import { cn } from "@/lib/utils"
import { useCodeExecution } from "@/hooks/useCodeExecution"
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

export function MarkdownPreview({
  source,
  className,
  debounceMs = 200,
  enableLocalEcho = true,
}: MarkdownPreviewProps) {
  const [html, setHtml] = useState("")
  const previewRef = useRef<HTMLDivElement>(null)
  const { theme, resolvedTheme } = useTheme()

  // Intelligent debouncing with local echo
  const { debouncedValue, isDebouncing, localEchoValue } = useDebouncedPreview(
    source,
    { debounceMs, enableLocalEcho }
  )

  // Use extracted hooks for code execution and processing
  const { executeJavaScript } = useCodeExecution()
  const { processCodeBlocks, processShikiBlocks } = useCodeBlocks({
    previewRef,
    executeJavaScript,
  })

  useEffect(() => {
    const parseMarkdown = async () => {
      try {
        // Replace emoji shortcodes with actual emoji characters
        const processedSource = replaceEmojis(debouncedValue)

        // Process markdown content with math support
        const result = await unified()
          .use(remarkParse)
          .use(remarkGfm)
          .use(remarkMath)
          .use(remarkRehype)
          .use(rehypeKatex)
          .use(rehypeStringify)
          .process(processedSource)

        let htmlContent = result.toString()

        // Add IDs to headings for navigation
        // Look for heading tags <h1> through <h6>
        htmlContent = htmlContent.replace(
          /<(h[1-6])>(.*?)<\/h[1-6]>/g,
          (match, tag, content) => {
            const id = content
              .toLowerCase()
              .replace(/<\/?[^>]+(>|$)/g, "") // Remove HTML tags inside heading
              .replace(/[^\w\s-]/g, "") // Remove special chars
              .replace(/\s+/g, "-") // Replace spaces with hyphens
              .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen

            return `<${tag} id="${id}">${content}</${tag}>`
          }
        )

        setHtml(htmlContent)
      } catch (error) {
        console.error("Error parsing markdown:", error)
        setHtml("<p>Error rendering markdown</p>")
      }
    }

    parseMarkdown()
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
}