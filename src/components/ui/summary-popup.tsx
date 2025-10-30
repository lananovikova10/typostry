"use client"

import React from "react"
import { X, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface SummaryPopupProps {
  isOpen: boolean
  onClose: () => void
  summary: string
  onInsert: () => void
}

export function SummaryPopup({
  isOpen,
  onClose,
  summary,
  onInsert,
}: SummaryPopupProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const handleInsert = () => {
    onInsert()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Summary</DialogTitle>
          <DialogDescription>
            AI-generated summary of the selected text
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="rounded-md border bg-muted/50 p-4 max-h-[400px] overflow-y-auto">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {summary}
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
          <Button onClick={handleInsert}>Insert at Caret</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
