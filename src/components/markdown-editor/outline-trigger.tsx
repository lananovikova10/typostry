"use client"

import { KeyboardEvent } from "react"

import { cn } from "@/lib/utils"

interface OutlineTriggerProps {
  isCollapsed: boolean
  onToggle: () => void
  className?: string
}

export function OutlineTrigger({
  isCollapsed,
  onToggle,
  className,
}: OutlineTriggerProps) {
  // Handle keyboard activation (Enter or Space)
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onToggle()
    }
  }

  return (
    <div
      className={cn(
        "editor-outline-trigger group absolute left-[-2px] top-1/2 z-10 h-60 w-4 -translate-y-1/2 cursor-pointer opacity-0 transition-opacity duration-200 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Open document outline"
      data-testid="outline-trigger"
    >
      {/* Visual handle */}
      <div className="absolute right-0 h-full w-[4px] rounded-r-sm bg-muted opacity-30 transition-all duration-200 group-hover:opacity-80 group-focus-visible:opacity-80" />
      
      {/* Subtle indicator when outline is open */}
      {!isCollapsed && (
        <div className="absolute right-0 h-full w-[4px] rounded-r-sm bg-primary/40" />
      )}
    </div>
  )
}