"use client"

import { useState } from "react"
import Link from "next/link"
import { PanelLeft } from "lucide-react"

import { siteConfig } from "@/config/site"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Icons } from "@/components/icons"
import { UserMenu } from "@/components/auth/user-menu"
import { DocumentsPanel } from "@/components/documents/documents-panel"
import { ImportDraftDialog } from "@/components/documents/import-draft-dialog"

interface DocumentsShellProps {
  children: React.ReactNode
}

/** Signed-in layout: document list next to the editor */
export function DocumentsShell({ children }: DocumentsShellProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  return (
    <main className="container py-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Icons.logo className="h-7 w-7 flex-shrink-0" />
            <span className="text-xl font-semibold">{siteConfig.name}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsPanelOpen(true)}
            >
              <PanelLeft className="mr-1.5 h-4 w-4" />
              Documents
            </Button>
            {/* Lives in the header so it's available even with no documents */}
            <UserMenu />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <DocumentsPanel className="sticky top-6" />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>

      <Dialog open={isPanelOpen} onOpenChange={setIsPanelOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogTitle className="sr-only">My documents</DialogTitle>
          <DocumentsPanel onNavigate={() => setIsPanelOpen(false)} />
        </DialogContent>
      </Dialog>

      <ImportDraftDialog />
    </main>
  )
}
