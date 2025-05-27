"use client"

import { KeyboardEvent, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { PanelLeftOpen } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
  const [shouldAnimate, setShouldAnimate] = useState(false)

  // Handle keyboard activation (Enter or Space)
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onToggle()
    }
  }

  // Trigger animation after a delay on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimate(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              "editor-outline-trigger absolute left-2 top-1/2 z-[1000] flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border border-l-1 bg-background shadow-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-gray-700 dark:bg-gray-800",
              className
            )}
            onClick={onToggle}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Show document outline"
            data-testid="outline-trigger"
            initial={{ opacity: 0.8 }}
            animate={
              shouldAnimate
                ? { opacity: [0.8, 1, 0.8], scale: [1, 1.05, 1] }
                : {}
            }
            transition={
              shouldAnimate ? { duration: 1.5, repeat: 0 } : { duration: 0.2 }
            }
            whileHover={{ opacity: 1, x: 2 }}
          >
            <PanelLeftOpen
              className={cn(
                "h-6 w-6 text-muted-foreground transition-colors",
                !isCollapsed && "text-primary"
              )}
              aria-hidden="true"
            />

            {/* Subtle indicator when outline is open */}
            {!isCollapsed && (
              <div className="absolute right-0 h-3 w-1 rounded-full bg-primary" />
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={5}>
          <p>Show document outline</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
