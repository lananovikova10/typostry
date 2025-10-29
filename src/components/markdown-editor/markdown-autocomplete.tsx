"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export interface AutocompleteItem {
  label: string
  value: string
  description?: string
  category?: string
}

export interface MarkdownAutocompleteProps {
  textarea: HTMLTextAreaElement | null
  value: string
  cursorPosition: number
  onSelect: (item: AutocompleteItem, replaceStart: number, replaceEnd: number) => void
  className?: string
}

// Markdown syntax suggestions
const MARKDOWN_SYNTAX: AutocompleteItem[] = [
  { label: "# Heading 1", value: "# ", description: "Large heading", category: "headings" },
  { label: "## Heading 2", value: "## ", description: "Medium heading", category: "headings" },
  { label: "### Heading 3", value: "### ", description: "Small heading", category: "headings" },
  { label: "#### Heading 4", value: "#### ", description: "Extra small heading", category: "headings" },
  { label: "##### Heading 5", value: "##### ", description: "Tiny heading", category: "headings" },
  { label: "###### Heading 6", value: "###### ", description: "Smallest heading", category: "headings" },
  { label: "**Bold**", value: "****", description: "Bold text", category: "formatting" },
  { label: "*Italic*", value: "**", description: "Italic text", category: "formatting" },
  { label: "~~Strikethrough~~", value: "~~~~", description: "Strikethrough text", category: "formatting" },
  { label: "`Code`", value: "``", description: "Inline code", category: "formatting" },
  { label: "```Code Block```", value: "```\n\n```", description: "Code block", category: "blocks" },
  { label: "[Link](url)", value: "[]()", description: "Hyperlink", category: "links" },
  { label: "![Image](url)", value: "![]()", description: "Image", category: "links" },
  { label: "> Blockquote", value: "> ", description: "Quote block", category: "blocks" },
  { label: "- List Item", value: "- ", description: "Unordered list", category: "lists" },
  { label: "1. List Item", value: "1. ", description: "Ordered list", category: "lists" },
  { label: "- [ ] Task", value: "- [ ] ", description: "Task list item", category: "lists" },
  { label: "---", value: "---\n", description: "Horizontal rule", category: "blocks" },
  { label: "| Table |", value: "| Header |\n| ------ |\n| Cell |", description: "Table", category: "blocks" },
]

export function MarkdownAutocomplete({
  textarea,
  value,
  cursorPosition,
  onSelect,
  className,
}: MarkdownAutocompleteProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [items, setItems] = useState<AutocompleteItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [triggerInfo, setTriggerInfo] = useState<{
    start: number
    end: number
    query: string
    type: "markdown" | "header"
  } | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Extract headers from the document
  const extractHeaders = (text: string): AutocompleteItem[] => {
    const headers: AutocompleteItem[] = []
    const lines = text.split("\n")

    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/)
      if (match) {
        const level = match[1].length
        const headerText = match[2].trim()
        const headerId = headerText
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")

        headers.push({
          label: `${match[1]} ${headerText}`,
          value: `#${headerId}`,
          description: `Line ${index + 1}`,
          category: "header-references",
        })
      }
    })

    return headers
  }

  // Calculate autocomplete position
  const calculatePosition = () => {
    if (!textarea) return

    const textBeforeCursor = value.substring(0, cursorPosition)
    const lines = textBeforeCursor.split("\n")
    const currentLine = lines.length
    const currentColumn = lines[lines.length - 1].length

    // Get textarea styles
    const styles = window.getComputedStyle(textarea)
    const fontSize = parseFloat(styles.fontSize)
    const lineHeight = parseFloat(styles.lineHeight) || fontSize * 1.5
    const paddingTop = parseFloat(styles.paddingTop)
    const paddingLeft = parseFloat(styles.paddingLeft)

    // Calculate position
    const textareaRect = textarea.getBoundingClientRect()
    const top = textareaRect.top + paddingTop + (currentLine - 1) * lineHeight + lineHeight - textarea.scrollTop
    const left = textareaRect.left + paddingLeft + currentColumn * (fontSize * 0.6) - textarea.scrollLeft

    setPosition({ top, left })
  }

  // Check for autocomplete triggers
  useEffect(() => {
    if (!textarea) return

    const textBeforeCursor = value.substring(0, cursorPosition)
    const textAfterCursor = value.substring(cursorPosition)

    // Get current line
    const lines = textBeforeCursor.split("\n")
    const currentLineText = lines[lines.length - 1]

    // Check for markdown syntax trigger (at start of line or after whitespace)
    const markdownMatch = currentLineText.match(/(?:^|\s)(#|>|-|\d+\.|```|`|\*|~|\[|!|\|)(.*)$/)
    if (markdownMatch) {
      const trigger = markdownMatch[1]
      const query = markdownMatch[2].toLowerCase()
      const start = cursorPosition - markdownMatch[2].length
      const end = cursorPosition

      // Filter markdown syntax items
      const filtered = MARKDOWN_SYNTAX.filter((item) => {
        const matchesTrigger = item.value.startsWith(trigger)
        const matchesQuery = query === "" || item.label.toLowerCase().includes(query)
        return matchesTrigger && matchesQuery
      })

      if (filtered.length > 0) {
        setItems(filtered)
        setSelectedIndex(0)
        setTriggerInfo({ start, end, query: markdownMatch[2], type: "markdown" })
        calculatePosition()
        setIsVisible(true)
        return
      }
    }

    // Check for header reference trigger (#reference)
    const headerMatch = textBeforeCursor.match(/\[([^\]]*)\]\(#([^\)]*)$/)
    if (headerMatch) {
      const query = headerMatch[2].toLowerCase()
      const start = cursorPosition - headerMatch[2].length
      const end = cursorPosition

      // Extract and filter headers
      const headers = extractHeaders(value)
      const filtered = headers.filter((item) => {
        return item.label.toLowerCase().includes(query) || item.value.toLowerCase().includes(query)
      })

      if (filtered.length > 0) {
        setItems(filtered)
        setSelectedIndex(0)
        setTriggerInfo({ start, end, query: headerMatch[2], type: "header" })
        calculatePosition()
        setIsVisible(true)
        return
      }
    }

    // Hide autocomplete if no triggers found
    setIsVisible(false)
    setTriggerInfo(null)
  }, [value, cursorPosition, textarea])

  // Keyboard navigation
  useEffect(() => {
    if (!isVisible || !textarea) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % items.length)
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
          break
        case "Enter":
        case "Tab":
          e.preventDefault()
          if (items[selectedIndex] && triggerInfo) {
            onSelect(items[selectedIndex], triggerInfo.start, triggerInfo.end)
            setIsVisible(false)
          }
          break
        case "Escape":
          e.preventDefault()
          setIsVisible(false)
          break
      }
    }

    textarea.addEventListener("keydown", handleKeyDown)
    return () => textarea.removeEventListener("keydown", handleKeyDown)
  }, [isVisible, items, selectedIndex, triggerInfo, textarea, onSelect])

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" })
      }
    }
  }, [selectedIndex])

  if (!isVisible || items.length === 0) {
    return null
  }

  return (
    <div
      ref={listRef}
      className={cn(
        "fixed z-50 max-h-64 w-80 overflow-y-auto rounded-md border border-border bg-popover shadow-lg",
        className
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {items.map((item, index) => (
        <button
          key={`${item.category}-${index}`}
          className={cn(
            "flex w-full cursor-pointer items-start gap-3 px-3 py-2 text-left transition-colors",
            index === selectedIndex
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50"
          )}
          onClick={() => {
            if (triggerInfo) {
              onSelect(item, triggerInfo.start, triggerInfo.end)
              setIsVisible(false)
            }
          }}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <div className="flex-1">
            <div className="font-mono text-sm font-medium">{item.label}</div>
            {item.description && (
              <div className="text-xs text-muted-foreground">{item.description}</div>
            )}
          </div>
          {item.category && (
            <div className="text-xs text-muted-foreground capitalize">
              {item.category.replace("-", " ")}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}
