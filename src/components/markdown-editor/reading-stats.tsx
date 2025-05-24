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
    characterCount: 0
  })
  const { resolvedTheme } = useTheme()

  // Recalculate stats when content changes
  useEffect(() => {
    const newStats = calculateReadingStats(content)
    setStats(newStats)
  }, [content])

  // Determine text color based on theme
  const textColorClass = resolvedTheme === "dark" 
    ? "text-neutral-400" 
    : "text-neutral-500"

  return (
    <div 
      className={cn(
        "py-2 px-3 text-xs font-mono", 
        textColorClass,
        className
      )}
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