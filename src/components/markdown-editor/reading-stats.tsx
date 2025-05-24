"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

import { calculateReadingStats } from "@/lib/reading-stats"
import { cn } from "@/lib/utils"

export interface ReadingStatsProps {
  content: string
  className?: string
}

export function ReadingStats({ content, className }: ReadingStatsProps) {
  const [stats, setStats] = useState({
    readingTime: 0,
    wordCount: 0,
    characterCount: 0,
  })
  const { resolvedTheme } = useTheme()

  // Recalculate stats when content changes
  useEffect(() => {
    const newStats = calculateReadingStats(content)
    setStats(newStats)
  }, [content])

  // Using consistent text-neutral-400 class to prevent hydration errors
  const textColorClass = "text-neutral-400"

  return (
    <div
      className={cn("px-3 py-2 font-mono text-xs", textColorClass, className)}
      role="status"
      aria-live="polite"
    >
      Reading Time: {stats.readingTime} min read
      <span className="mx-2">·</span>
      Words: {stats.wordCount}
      <span className="mx-2">·</span>
      Characters: {stats.characterCount}
    </div>
  )
}
