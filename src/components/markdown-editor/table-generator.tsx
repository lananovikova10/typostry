"use client"

import React, { useState } from "react"
import { Table as TableIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface TableGridProps {
  onSelect: (rows: number, cols: number) => void
}

interface TableGeneratorProps {
  onInsertTable: (text: string) => void
  isDisabled: boolean
}

export function TableGrid({ onSelect }: TableGridProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number }>({
    row: 0,
    col: 0,
  })

  // Max dimensions for the grid
  const MAX_ROWS = 10
  const MAX_COLS = 8

  // Generate the grid cells
  const rows = Array.from({ length: MAX_ROWS }, (_, rowIndex) => rowIndex + 1)
  const cols = Array.from({ length: MAX_COLS }, (_, colIndex) => colIndex + 1)

  return (
    <div className="p-2">
      <div className="mb-2 text-center text-sm">
        {hoveredCell.row > 0 && hoveredCell.col > 0
          ? `${hoveredCell.row} × ${hoveredCell.col} table`
          : "Hover to select table size"}
      </div>
      <div className="grid grid-flow-row gap-1">
        {rows.map((row) => (
          <div key={row} className="flex gap-1">
            {cols.map((col) => (
              <button
                key={col}
                className={`h-6 w-6 rounded border border-gray-300 ${
                  row <= hoveredCell.row && col <= hoveredCell.col
                    ? "bg-primary/30"
                    : "bg-secondary/30"
                } transition-colors hover:bg-primary/30`}
                onMouseEnter={() => setHoveredCell({ row, col })}
                onClick={() => onSelect(row, col)}
                aria-label={`Select ${row}×${col} table`}
                type="button"
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 text-center text-xs text-muted-foreground">
        Max size: 10 rows × 8 columns
      </div>
    </div>
  )
}

export function generateTableMarkdown(rows: number, cols: number): string {
  // Create header row
  let tableMarkdown = "|"
  for (let i = 1; i <= cols; i++) {
    tableMarkdown += ` Header ${i} |`
  }
  tableMarkdown += "\n|"

  // Create separator row
  for (let i = 0; i < cols; i++) {
    tableMarkdown += "----------|"
  }
  tableMarkdown += "\n"

  // Create data rows
  for (let i = 0; i < rows; i++) {
    tableMarkdown += "|"
    for (let j = 0; j < cols; j++) {
      tableMarkdown += "          |"
    }
    tableMarkdown += "\n"
  }

  return tableMarkdown
}

export function TableGenerator({
  onInsertTable,
  isDisabled,
}: TableGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Handle escape key to close the popover
  React.useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscapeKey)
    return () => document.removeEventListener("keydown", handleEscapeKey)
  }, [isOpen])

  const handleSelectTable = (rows: number, cols: number) => {
    const tableMarkdown = generateTableMarkdown(rows, cols)
    onInsertTable(tableMarkdown)
    setIsOpen(false)

    // Set focus to the first header cell
    setTimeout(() => {
      const textarea = document.querySelector(
        'textarea[data-testid="markdown-input"]'
      ) as HTMLTextAreaElement
      
      if (textarea) {
        const cursorPosition = textarea.selectionStart
        const headerEndPosition = textarea.value.indexOf("Header 1") + "Header 1".length
        
        if (cursorPosition >= 0 && headerEndPosition > 0) {
          const headerStartPosition = headerEndPosition - "Header 1".length
          textarea.setSelectionRange(headerStartPosition, headerEndPosition)
          textarea.focus()
        }
      }
    }, 0)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(true)}
                aria-label="Insert table"
                disabled={isDisabled}
                className="h-8 w-8 flex-shrink-0 text-[hsl(var(--markdown-toolbar-icon))] hover:bg-secondary/70 hover:text-[hsl(var(--markdown-toolbar-icon-hover))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--markdown-toolbar-active))]"
                data-testid="toolbar-table"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Insert table</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent
        className="w-auto p-0"
        align="start"
        data-testid="table-grid-popover"
      >
        <TableGrid onSelect={handleSelectTable} />
      </PopoverContent>
    </Popover>
  )
}