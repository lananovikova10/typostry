"use client"

import { getTimeSinceLastSave } from "@/lib/auto-save"
import { DocumentSnapshot } from "@/lib/documents/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ConflictDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  localContent: string
  remote: DocumentSnapshot
  onKeepMine: () => void
  onLoadLatest: () => void
  onSaveCopy?: () => void
}

function countLines(text: string): number {
  return text.length === 0 ? 0 : text.split("\n").length
}

function firstDifferentLine(a: string, b: string): number | null {
  const aLines = a.split("\n")
  const bLines = b.split("\n")
  const max = Math.max(aLines.length, bLines.length)
  for (let i = 0; i < max; i++) {
    if (aLines[i] !== bLines[i]) return i + 1
  }
  return null
}

export function ConflictDialog({
  open,
  onOpenChange,
  localContent,
  remote,
  onKeepMine,
  onLoadLatest,
  onSaveCopy,
}: ConflictDialogProps) {
  const changedLine = firstDifferentLine(localContent, remote.content)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="conflict-dialog">
        <DialogHeader>
          <DialogTitle>This document changed elsewhere</DialogTitle>
          <DialogDescription>
            A newer version was saved{" "}
            {getTimeSinceLastSave(new Date(remote.updatedAt).getTime())}, probably
            from another tab or device. Your changes have not been saved yet.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>Your version: {countLines(localContent)} lines</li>
          <li>Saved version: {countLines(remote.content)} lines</li>
          {changedLine && <li>First difference at line {changedLine}</li>}
        </ul>

        <DialogFooter className="gap-2 sm:gap-0">
          {onSaveCopy && (
            <Button variant="outline" onClick={onSaveCopy}>
              Save mine as copy
            </Button>
          )}
          <Button variant="outline" onClick={onLoadLatest}>
            Load latest
          </Button>
          <Button onClick={onKeepMine}>Keep mine</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
