"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
// @ts-ignore - react-window types are incomplete
import { VariableSizeList } from "react-window"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { measurementCache } from "@/lib/measurement-cache"

export interface VirtualizedPreviewProps {
  htmlContent: string
  className?: string
}

interface ContentBlock {
  id: string
  content: string
  height: number
  type: "text" | "code" | "heading" | "list" | "table"
  signature: string // Block signature for measurement cache
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
  const measuredHeightsRef = useRef<Map<number, number>>(new Map())
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

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

      const content = el.outerHTML
      const signature = measurementCache.generateSignature(content, type)

      // Check if we have a cached measurement for this signature
      const cachedHeight = measurementCache.get(signature)
      const height = cachedHeight !== null ? cachedHeight : estimatedHeight

      return {
        id: `block-${index}`,
        content,
        height,
        type,
        signature,
      }
    })

    setBlocks(parsedBlocks)
    // Reset measured heights when content changes
    measuredHeightsRef.current.clear()
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

  // Callback to update measured height
  const updateMeasuredHeight = useCallback(
    (index: number, height: number) => {
      const block = blocks[index]
      if (!block) return

      const currentHeight = measuredHeightsRef.current.get(index)

      // Only update if height has changed significantly (> 5px difference)
      if (currentHeight === undefined || Math.abs(currentHeight - height) > 5) {
        measuredHeightsRef.current.set(index, height)

        // Update cache with the measured height
        measurementCache.set(block.signature, height)

        // Update the block height
        setBlocks((prevBlocks) => {
          const newBlocks = [...prevBlocks]
          if (newBlocks[index]) {
            newBlocks[index] = { ...newBlocks[index], height }
          }
          return newBlocks
        })

        // Reset the item size in the virtual list
        if (listRef.current) {
          listRef.current.resetAfterIndex(index)
        }
      }
    },
    [blocks]
  )

  // Get item size for virtual list
  const getItemSize = (index: number) => {
    // Use measured height if available, otherwise use block's height
    const measuredHeight = measuredHeightsRef.current.get(index)
    return measuredHeight !== undefined ? measuredHeight : blocks[index]?.height || 50
  }

  // Row renderer for virtual list with measurement
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const block = blocks[index]
    const rowRef = useRef<HTMLDivElement>(null)

    // Measure actual height using ResizeObserver
    useEffect(() => {
      if (!rowRef.current || !block) return

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const height = entry.contentRect.height
          if (height > 0) {
            updateMeasuredHeight(index, height)
          }
        }
      })

      observer.observe(rowRef.current)

      // Also measure immediately on mount
      const currentHeight = rowRef.current.getBoundingClientRect().height
      if (currentHeight > 0) {
        updateMeasuredHeight(index, currentHeight)
      }

      return () => observer.disconnect()
    }, [index, block])

    if (!block) return null

    return (
      <div
        ref={rowRef}
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
