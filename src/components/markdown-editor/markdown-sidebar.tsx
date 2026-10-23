"use client"

import React, { useMemo, useState } from "react"
import { ChevronDown, ChevronRight, Hash } from "lucide-react"

import { extractHeadings, MarkdownHeading } from "@/lib/markdown-headings"
import { cn } from "@/lib/utils"

interface HeadingNode extends MarkdownHeading {
  index: number
  children: HeadingNode[]
}

// Nests flat headings: each heading owns the following deeper headings
function buildHeadingTree(headings: MarkdownHeading[]): HeadingNode[] {
  const roots: HeadingNode[] = []
  const stack: HeadingNode[] = []

  headings.forEach((heading, index) => {
    const node: HeadingNode = { ...heading, index, children: [] }
    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop()
    }
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(node)
    } else {
      roots.push(node)
    }
    stack.push(node)
  })

  return roots
}

export interface MarkdownSidebarProps {
  content: string
  onHeadingClick: (id: string) => void
  isCollapsed: boolean
  className?: string
  activeHeadingId?: string
}

export const MarkdownSidebar = React.memo(function MarkdownSidebar({
  content,
  onHeadingClick,
  isCollapsed,
  className,
  activeHeadingId,
}: MarkdownSidebarProps) {
  const headingTree = useMemo(
    () => buildHeadingTree(extractHeadings(content)),
    [content]
  )
  // Keyed by heading id so expansion survives edits elsewhere in the document
  const [collapsedIds, setCollapsedIds] = useState<Record<string, boolean>>({})

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent heading click
    setCollapsedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const renderHeadings = (nodes: HeadingNode[]): JSX.Element[] =>
    nodes.map((heading) => {
      const hasChildHeadings = heading.children.length > 0
      const isExpanded = !collapsedIds[heading.id]
      const isActive = activeHeadingId === heading.id

      return (
        <div key={`${heading.id}-${heading.index}`} className="mb-1">
          <div
            role="button"
            tabIndex={0}
            aria-current={isActive ? "location" : undefined}
            className={cn(
              "flex cursor-pointer items-center rounded-md px-2 py-1 text-sm hover:bg-secondary/50",
              "transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive && "bg-primary/10 font-medium text-primary"
            )}
            onClick={() => onHeadingClick(heading.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onHeadingClick(heading.id)
              }
            }}
          >
            <div className="mr-1 w-5 flex-shrink-0">
              {hasChildHeadings ? (
                <button
                  onClick={(e) => toggleExpand(heading.id, e)}
                  className="rounded-sm p-0.5 hover:bg-secondary/80 focus:outline-none"
                  aria-label={isExpanded ? "Collapse section" : "Expand section"}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              ) : (
                <Hash className="ml-0.5 h-3.5 w-3.5" aria-hidden="true" />
              )}
            </div>
            <span
              className={cn(
                "truncate",
                heading.level === 1 && "font-semibold",
                heading.level > 3 && "text-xs"
              )}
            >
              {heading.text}
            </span>
          </div>

          {/* Render children if expanded */}
          {hasChildHeadings && isExpanded && (
            <div className="pl-4">{renderHeadings(heading.children)}</div>
          )}
        </div>
      )
    })

  if (isCollapsed) {
    return null
  }

  return (
    <div
      className={cn(
        "w-64 overflow-y-auto border-r border-border bg-background p-2",
        className
      )}
      data-testid="markdown-sidebar"
      role="complementary"
    >
      <h3 className="mb-2 px-2 text-sm font-semibold">Document Outline</h3>
      <div className="space-y-1">
        {headingTree.length === 0 ? (
          <p className="px-2 text-sm text-muted-foreground">
            No headings found
          </p>
        ) : (
          renderHeadings(headingTree)
        )}
      </div>
    </div>
  )
})
