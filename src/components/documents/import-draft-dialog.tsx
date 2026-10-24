"use client"

import { useEffect, useState } from "react"

import { clearLocalStorage, getTimeSinceLastSave } from "@/lib/auto-save"
import {
  getPendingDraft,
  PendingDraft,
  rememberDraftDecision,
} from "@/lib/documents/import-draft"
import { deriveTitle } from "@/lib/documents/title"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/components/auth/auth-provider"
import { useDocuments } from "@/components/documents/documents-provider"

/**
 * After sign-in, offers to turn the guest localStorage draft into a cloud
 * document. Asked once per draft.
 */
export function ImportDraftDialog() {
  const { user } = useAuth()
  const { create } = useDocuments()
  const [draft, setDraft] = useState<PendingDraft | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    if (user) setDraft(getPendingDraft(user.id))
  }, [user])

  if (!user || !draft) return null

  const handleImport = async () => {
    setIsImporting(true)
    const created = await create({
      title: deriveTitle(draft.content, "Imported draft"),
      content: draft.content,
    })
    setIsImporting(false)
    // On failure keep the draft and the dialog so the user can retry
    if (!created) return
    rememberDraftDecision(user.id, draft)
    clearLocalStorage()
    setDraft(null)
  }

  const handleKeepLocal = () => {
    rememberDraftDecision(user.id, draft)
    setDraft(null)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isImporting && handleKeepLocal()}>
      <DialogContent data-testid="import-draft-dialog">
        <DialogHeader>
          <DialogTitle>Save your draft to your account?</DialogTitle>
          <DialogDescription>
            You have a draft on this device from{" "}
            {getTimeSinceLastSave(draft.timestamp)} (&ldquo;
            {deriveTitle(draft.content, "Untitled draft")}&rdquo;). Import it
            as a new document to keep it in the cloud.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleKeepLocal}>
            Not now
          </Button>
          <Button onClick={handleImport} disabled={isImporting}>
            {isImporting ? "Importing…" : "Import draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
