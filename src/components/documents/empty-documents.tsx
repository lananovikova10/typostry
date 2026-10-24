"use client"

import { FilePlus } from "lucide-react"

import { WELCOME_MARKDOWN } from "@/config/welcome-document"
import { Button } from "@/components/ui/button"
import { useDocuments } from "@/components/documents/documents-provider"

export function EmptyDocuments() {
  const { create } = useDocuments()

  return (
    <div className="flex flex-col items-center gap-4 rounded-md border border-dashed px-6 py-16 text-center">
      <h1 className="text-xl font-semibold">Create your first document</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Documents are saved to your account automatically, so you can pick up
        where you left off on any device.
      </p>
      <Button
        onClick={() => void create({ title: "Hello World", content: WELCOME_MARKDOWN })}
        data-testid="create-first-document"
      >
        <FilePlus className="mr-2 h-4 w-4" />
        New document
      </Button>
    </div>
  )
}
