"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Check, Info, Plus, X } from "lucide-react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"

import { cn } from "@/lib/utils"
import { GrammarError } from "@/lib/grammar-check/types"

interface GrammarTooltipProps {
  error: GrammarError
  onApplyReplacement: (replacement: string) => void
  onAddToDictionary: () => void
}

export function GrammarTooltip({
  error,
  onApplyReplacement,
  onAddToDictionary,
}: GrammarTooltipProps) {
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null)

  // Handle confirmation message timeout
  useEffect(() => {
    if (showConfirmation) {
      const timer = setTimeout(() => {
        setShowConfirmation(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showConfirmation])

  const handleApplyReplacement = (replacement: string) => {
    onApplyReplacement(replacement)
    setShowConfirmation(`Changed to "${replacement}"`)
  }

  const handleAddToDictionary = () => {
    onAddToDictionary()
    setShowConfirmation("Added to dictionary")
  }

  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <span
            className={cn(
              "grammar-error underline",
              `grammar-error-${error.severity}`
            )}
          />
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="top"
            align="start"
            sideOffset={5}
            collisionPadding={16}
            avoidCollisions={true}
            className="z-50 max-w-sm overflow-hidden rounded-md border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-md animate-in fade-in-50"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400" />
                <span className="flex-1">{error.message}</span>
              </div>

              {error.replacements.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {error.replacements.slice(0, 5).map((replacement, index) => (
                    <button
                      key={index}
                      className="inline-flex h-8 items-center rounded-full border border-input bg-background px-3 text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      onClick={() => handleApplyReplacement(replacement.value)}
                    >
                      <Check className="mr-1.5 h-3.5 w-3.5 text-green-600 dark:text-green-500" />
                      {replacement.value}
                    </button>
                  ))}
                </div>
              )}

              {error.replacements.length > 0 && (
                <div className="h-px w-full bg-border my-1" aria-hidden="true" />
              )}

              <div className="flex justify-end">
                <button
                  className="inline-flex h-8 items-center rounded-full border border-input bg-background px-3 text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onClick={handleAddToDictionary}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5 text-blue-600 dark:text-blue-500" />
                  Add to dictionary
                </button>
              </div>
            </div>
            <TooltipPrimitive.Arrow className="fill-current text-border" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>

      {/* Confirmation toast */}
      {showConfirmation && (
        <div className="grammar-action-confirmation" role="alert">
          <div className="flex items-center">
            <Check className="mr-2 h-4 w-4" />
            {showConfirmation}
          </div>
        </div>
      )}
    </TooltipPrimitive.Provider>
  )
}

export function GrammarContextMenu({
  error,
  onApplyReplacement,
  onAddToDictionary,
  children,
}: GrammarTooltipProps & { children: React.ReactNode }) {
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null)

  // Handle confirmation message timeout
  useEffect(() => {
    if (showConfirmation) {
      const timer = setTimeout(() => {
        setShowConfirmation(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showConfirmation])

  const handleApplyReplacement = (replacement: string) => {
    onApplyReplacement(replacement)
    setShowConfirmation(`Changed to "${replacement}"`)
  }

  const handleAddToDictionary = () => {
    onAddToDictionary()
    setShowConfirmation("Added to dictionary")
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          {children}
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-2 text-popover-foreground shadow-md animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
            collisionPadding={16}
            avoidCollisions={true}
          >
            <DropdownMenu.Label className="px-2 py-1.5 text-sm font-semibold">
              {error.message}
            </DropdownMenu.Label>

            <DropdownMenu.Separator className="my-1.5 h-px bg-muted" />

            {error.replacements.slice(0, 5).map((replacement, index) => (
              <DropdownMenu.Item
                key={index}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                onClick={() => handleApplyReplacement(replacement.value)}
              >
                <Check className="mr-2 h-4 w-4 text-green-600 dark:text-green-500" />
                {replacement.value}
              </DropdownMenu.Item>
            ))}

            <DropdownMenu.Separator className="my-1.5 h-px bg-muted" />

            <DropdownMenu.Item
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              onClick={handleAddToDictionary}
            >
              <Plus className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-500" />
              Add to dictionary
            </DropdownMenu.Item>

            <DropdownMenu.Item
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
              <X className="mr-2 h-4 w-4 text-red-600 dark:text-red-500" />
              Ignore
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Confirmation toast */}
      {showConfirmation && (
        <div className="grammar-action-confirmation" role="alert">
          <div className="flex items-center">
            <Check className="mr-2 h-4 w-4" />
            {showConfirmation}
          </div>
        </div>
      )}
    </>
  )
}
