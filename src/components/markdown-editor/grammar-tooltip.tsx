"use client"

import * as React from "react"
import { Check, Info, Plus, X } from "lucide-react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"

import { cn } from "@/lib/utils"
import { GrammarError } from "@/lib/grammar-check"

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
  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <span
            className={cn(
              "grammar-error underline",
              error.type === "spelling" 
                ? "grammar-error-spelling" 
                : "grammar-error-grammar"
            )}
          />
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="top"
            align="start"
            sideOffset={5}
            className="z-50 max-w-sm overflow-hidden rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md animate-in fade-in-50"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <span className="flex-1">{error.message}</span>
              </div>
              
              {error.replacements.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {error.replacements.slice(0, 5).map((replacement, index) => (
                    <button
                      key={index}
                      className="inline-flex h-7 items-center rounded-full border border-input bg-background px-2 text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      onClick={() => onApplyReplacement(replacement.value)}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      {replacement.value}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  className="inline-flex h-7 items-center rounded-full border border-input bg-background px-2 text-xs font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onClick={onAddToDictionary}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add to dictionary
                </button>
              </div>
            </div>
            <TooltipPrimitive.Arrow className="fill-current text-border" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

export function GrammarContextMenu({
  error,
  onApplyReplacement,
  onAddToDictionary,
  children,
}: GrammarTooltipProps & { children: React.ReactNode }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {children}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-sm font-semibold">
            {error.message}
          </DropdownMenu.Label>
          
          <DropdownMenu.Separator className="my-1 h-px bg-muted" />
          
          {error.replacements.slice(0, 5).map((replacement, index) => (
            <DropdownMenu.Item
              key={index}
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              onClick={() => onApplyReplacement(replacement.value)}
            >
              <Check className="mr-2 h-4 w-4" />
              {replacement.value}
            </DropdownMenu.Item>
          ))}
          
          <DropdownMenu.Separator className="my-1 h-px bg-muted" />
          
          <DropdownMenu.Item
            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            onClick={onAddToDictionary}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add to dictionary
          </DropdownMenu.Item>
          
          <DropdownMenu.Item
            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          >
            <X className="mr-2 h-4 w-4" />
            Ignore
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}