"use client"

import React, { useEffect, useRef, useState } from "react"
// @ts-ignore - react-window types are incomplete
import { VariableSizeList } from "react-window"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

export interface VirtualizedPreviewProps {
  htmlContent: string
  className?: string
}

interface ContentBlock {
  id: string
  content: string
  height: number
  type: "text" | "code" | "heading" | "list" | "table"
}

/**
 * VirtualizedPreview component for efficient rendering of large markdown documents
 * Uses react-window for virtual scrolling to improve performance
 */
export function VirtualizedPreview({
  htmlContent,
  className,
}: VirtualizedPreviewProps) {
  const listRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [containerHeight, setContainerHeight] = useState(600)
  const { resolvedTheme } = useTheme()

  // Parse HTML into content blocks for virtual rendering
  useEffect(() => {
    if (!htmlContent) {
      setBlocks([])
      return
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, "text/html")
    const elements = Array.from(doc.body.children)

    const parsedBlocks: ContentBlock[] = elements.map((el, index) => {
      const tagName = el.tagName.toLowerCase()
      let type: ContentBlock["type"] = "text"
      let estimatedHeight = 50

      // Estimate height based on element type
      if (tagName.match(/^h[1-6]$/)) {
        type = "heading"
        estimatedHeight = tagName === "h1" ? 80 : tagName === "h2" ? 70 : 60
      } else if (tagName === "pre") {
        type = "code"
        const lines = el.textContent?.split("\n").length || 1
        estimatedHeight = Math.max(100, lines * 20 + 40)
      } else if (tagName === "ul" || tagName === "ol") {
        type = "list"
        const items = el.querySelectorAll("li").length
        estimatedHeight = items * 30 + 20
      } else if (tagName === "table") {
        type = "table"
        const rows = el.querySelectorAll("tr").length
        estimatedHeight = rows * 40 + 40
      } else {
        const lines = el.textContent?.split("\n").length || 1
        estimatedHeight = Math.max(30, lines * 24)
      }

      return {
        id: `block-${index}`,
        content: el.outerHTML,
        height: estimatedHeight,
        type,
      }
    })

    setBlocks(parsedBlocks)
  }, [htmlContent])

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight)
      }
    }

    updateHeight()
    window.addEventListener("resize", updateHeight)
    return () => window.removeEventListener("resize", updateHeight)
  }, [])

  // Get item size for virtual list
  const getItemSize = (index: number) => {
    return blocks[index]?.height || 50
  }

  // Row renderer for virtual list
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const block = blocks[index]
    if (!block) return null

    return (
      <div
        style={style}
        className={cn("px-6 py-2")}
        dangerouslySetInnerHTML={{ __html: block.content }}
      />
    )
  }

  if (blocks.length === 0) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "prose w-full max-w-none overflow-auto rounded-md border border-[hsl(var(--markdown-input-border))] bg-[hsl(var(--markdown-input-bg))] px-6 py-4 text-[hsl(var(--markdown-input-text))] shadow-inner dark:prose-invert",
          className
        )}
      >
        <p className="text-muted-foreground">No content to display</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "prose w-full max-w-none overflow-hidden rounded-md border border-[hsl(var(--markdown-input-border))] bg-[hsl(var(--markdown-input-bg))] text-[hsl(var(--markdown-input-text))] shadow-inner dark:prose-invert",
        "prose-headings:text-[hsl(var(--foreground))] prose-p:text-[hsl(var(--markdown-input-text))]",
        "prose-a:text-[hsl(var(--markdown-toolbar-active))] prose-a:no-underline hover:prose-a:underline",
        "prose-code:rounded-sm prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:text-[hsl(var(--foreground))]",
        "prose-pre:bg-muted prose-pre:shadow-sm",
        className
      )}
      data-testid="virtualized-markdown-preview"
    >
      <VariableSizeList
        ref={listRef}
        height={containerHeight}
        itemCount={blocks.length}
        itemSize={getItemSize}
        width="100%"
        className="scrollbar-thin"
      >
        {Row}
      </VariableSizeList>
    </div>
  )
}
