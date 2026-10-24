"use client"

import { AlertTriangle, Check, CloudOff, Loader2, Trash2 } from "lucide-react"

import { getTimeSinceLastSave } from "@/lib/auto-save"
import { SaveStatus } from "@/lib/documents/types"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface SaveStatusIndicatorProps {
  status: SaveStatus
  lastSavedAt?: number | null
  onResolveConflict?: () => void
  className?: string
}

const STATUS_COPY: Record<SaveStatus, { label: string; tooltip: string }> = {
  idle: { label: "Saved", tooltip: "All changes are saved to your account" },
  saved: { label: "Saved", tooltip: "All changes are saved to your account" },
  dirty: { label: "Unsaved", tooltip: "Changes will be saved in a moment" },
  saving: { label: "Saving…", tooltip: "Saving to your account" },
  offline: {
    label: "Offline",
    tooltip: "Saved on this device. Will sync when you're back online",
  },
  error: {
    label: "Retrying",
    tooltip: "Couldn't save to the server. Saved on this device, retrying",
  },
  conflict: {
    label: "Conflict",
    tooltip: "This document was changed elsewhere. Click to resolve",
  },
  deleted: {
    label: "Deleted",
    tooltip: "This document was deleted. Download it to keep your text",
  },
}

export function SaveStatusIndicator({
  status,
  lastSavedAt,
  onResolveConflict,
  className,
}: SaveStatusIndicatorProps) {
  const { label, tooltip } = STATUS_COPY[status]

  const icon =
    status === "saving" ? (
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
    ) : status === "offline" ? (
      <CloudOff className="h-3.5 w-3.5" />
    ) : status === "error" || status === "conflict" ? (
      <AlertTriangle className="h-3.5 w-3.5" />
    ) : status === "deleted" ? (
      <Trash2 className="h-3.5 w-3.5" />
    ) : status === "dirty" ? (
      <span className="h-2 w-2 rounded-full bg-amber-500" />
    ) : (
      <Check className="h-3.5 w-3.5" />
    )

  const isClickable = status === "conflict" && onResolveConflict

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={isClickable ? onResolveConflict : undefined}
            aria-live="polite"
            data-testid="save-status"
            data-status={status}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium",
              status === "saved" || status === "idle"
                ? "text-green-600 dark:text-green-400"
                : status === "dirty" || status === "saving"
                  ? "text-muted-foreground"
                  : status === "offline"
                    ? "text-muted-foreground"
                    : "text-destructive",
              !isClickable && "cursor-default",
              className
            )}
          >
            {icon}
            <span>{label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
          {lastSavedAt && (
            <p className="text-xs text-muted-foreground">
              Last saved {getTimeSinceLastSave(lastSavedAt)}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
