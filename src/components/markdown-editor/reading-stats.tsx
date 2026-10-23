"use client"

import React, { useMemo } from "react"

import { calculateReadingStats } from "@/lib/reading-stats"
import { cn } from "@/lib/utils"

export interface ReadingStatsProps {
  content: string
  className?: string
}

export const ReadingStats = React.memo(function ReadingStats({ content, className }: ReadingStatsProps) {
  // Recalculate stats when content changes
  const stats = useMemo(() => calculateReadingStats(content), [content])

  // Using consistent text-neutral-400 class to prevent hydration errors
  const textColorClass = "text-neutral-400"

  return (
    <div
      className={cn("px-3 py-2 font-mono text-xs", textColorClass, className)}
    >
      Reading Time: {stats.readingTime} min read
      <span className="mx-2">·</span>
      Words: {stats.wordCount}
      <span className="mx-2">·</span>
      Characters: {stats.characterCount}
    </div>
  )
})
