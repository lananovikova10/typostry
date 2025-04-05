"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Hash } from "lucide-react"

import { cn } from "@/lib/utils"

interface HeadingItem {
  text: string
  level: number
  id: string
}

export interface MarkdownSidebarProps {
  content: string
  onHeadingClick: (id: string) => void
  isCollapsed: boolean
  className?: string
}

export function MarkdownSidebar({
  content,
  onHeadingClick,
  isCollapsed,
  className,
}: MarkdownSidebarProps) {
  const [headings, setHeadings] = useState<HeadingItem[]>([])
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  // Extract headings from the markdown content
  useEffect(() => {
    if (!content) {
      setHeadings([])
      return
    }

    // Regular expression to match Markdown headings
    // It captures the heading level (number of #s) and the heading text
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    const extractedHeadings: HeadingItem[] = []
    let match

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length
      const text = match[2].trim()
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "") // Remove special chars
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen
      
      extractedHeadings.push({ text, level, id })
    }

    setHeadings(extractedHeadings)

    // Initialize expanded state for all top-level items
    const initialExpandedState: Record<string, boolean> = {}
    extractedHeadings.forEach((heading, index) => {
      if (heading.level === 1) {
        initialExpandedState[index] = true
      }
    })
    setExpandedItems(initialExpandedState)
  }, [content])

  // Toggle expansion of an item
  const toggleExpand = (index: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent heading click
    setExpandedItems({
      ...expandedItems,
      [index]: !expandedItems[index],
    })
  }

  // Check if a heading has children
  const hasChildren = (index: number) => {
    if (index >= headings.length - 1) return false
    const currentLevel = headings[index].level
    const nextLevel = headings[index + 1].level
    return nextLevel > currentLevel
  }

  // Render the heading hierarchy recursively
  const renderHeadings = (startIndex: number, parentLevel: number): JSX.Element[] => {
    const result: JSX.Element[] = []
    
    for (let i = startIndex; i < headings.length; i++) {
      const heading = headings[i]
      
      // Skip if this is not a direct child of parent (lower level or higher level)
      if (heading.level <= parentLevel) {
        break
      }
      
      // Skip if this is not an immediate child of parent
      if (i > startIndex && heading.level > parentLevel + 1) {
        continue
      }
      
      const isExpanded = expandedItems[i] === true
      const hasChildHeadings = hasChildren(i)
      
      const headingItem = (
        <div key={`${heading.id}-${i}`} className="mb-1">
          <div 
            className={cn(
              "flex items-center py-1 px-2 rounded-md hover:bg-secondary/50 cursor-pointer text-sm",
              "transition-colors duration-200"
            )}
            onClick={() => onHeadingClick(heading.id)}
          >
            <div className="mr-1 w-5 flex-shrink-0">
              {hasChildHeadings ? (
                <button
                  onClick={(e) => toggleExpand(i, e)}
                  className="focus:outline-none p-0.5 hover:bg-secondary/80 rounded-sm"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              ) : (
                <Hash className="h-3.5 w-3.5 ml-0.5" />
              )}
            </div>
            <span 
              className={cn(
                "truncate",
                heading.level === 1 && "font-semibold",
                heading.level > 3 && "text-xs"
              )}
              style={{ paddingLeft: `${(heading.level - 1) * 8}px` }}
            >
              {heading.text}
            </span>
          </div>
          
          {/* Render children if expanded */}
          {hasChildHeadings && isExpanded && (
            <div className="pl-4">
              {renderHeadings(i + 1, heading.level)}
            </div>
          )}
        </div>
      )
      
      result.push(headingItem)
    }
    
    return result
  }

  if (isCollapsed) {
    return null
  }

  return (
    <div 
      className={cn(
        "w-64 border-r border-border overflow-y-auto p-2 bg-background",
        className
      )}
      data-testid="markdown-sidebar"
    >
      <h3 className="font-semibold mb-2 px-2 text-sm">Document Outline</h3>
      <div className="space-y-1">
        {headings.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2">No headings found</p>
        ) : (
          renderHeadings(0, 0)
        )}
      </div>
    </div>
  )
}