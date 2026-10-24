"use client"

import { KeyboardEvent, useMemo, useState } from "react"
import Link from "next/link"
import { FilePlus, Pencil, Trash2 } from "lucide-react"

import { getTimeSinceLastSave } from "@/lib/auto-save"
import { DEFAULT_DOCUMENT_TITLE } from "@/lib/documents/title"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDocuments } from "@/components/documents/documents-provider"

interface DocumentsPanelProps {
  /** Called after navigating to a document (closes the mobile drawer) */
  onNavigate?: () => void
  className?: string
}

export function DocumentsPanel({ onNavigate, className }: DocumentsPanelProps) {
  const { documents, activeDocumentId, create, rename, remove } = useDocuments()
  const [filter, setFilter] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState("")

  const visibleDocuments = useMemo(() => {
    const query = filter.trim().toLowerCase()
    return query
      ? documents.filter((doc) => doc.title.toLowerCase().includes(query))
      : documents
  }, [documents, filter])

  const handleCreate = async () => {
    await create({ title: DEFAULT_DOCUMENT_TITLE, content: "" })
    onNavigate?.()
  }

  const startRename = (id: string, title: string) => {
    setEditingId(id)
    setDraftTitle(title)
  }

  const commitRename = async () => {
    const id = editingId
    const title = draftTitle.trim()
    setEditingId(null)
    const current = documents.find((doc) => doc.id === id)
    if (id && title && title !== current?.title) await rename(id, title)
  }

  const handleRenameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault()
      void commitRename()
    } else if (event.key === "Escape") {
      event.preventDefault()
      setEditingId(null)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      await remove(id)
    }
  }

  return (
    <nav
      className={cn("flex flex-col gap-3", className)}
      aria-label="My documents"
      data-testid="documents-panel"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">My documents</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={handleCreate}
          data-testid="new-document"
        >
          <FilePlus className="mr-1.5 h-4 w-4" />
          New
        </Button>
      </div>

      {documents.length > 5 && (
        <Input
          type="search"
          placeholder="Filter documents"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filter documents"
        />
      )}

      <ul className="flex flex-col gap-0.5">
        {visibleDocuments.map((doc) => {
          const isActive = doc.id === activeDocumentId
          return (
            <li
              key={doc.id}
              className={cn(
                "group flex items-center gap-1 rounded-md pr-1",
                isActive ? "bg-secondary" : "hover:bg-secondary/60"
              )}
              data-testid="document-item"
            >
              {editingId === doc.id ? (
                <Input
                  autoFocus
                  value={draftTitle}
                  onChange={(event) => setDraftTitle(event.target.value)}
                  onBlur={() => void commitRename()}
                  onKeyDown={handleRenameKeyDown}
                  maxLength={200}
                  aria-label="Document title"
                  className="h-8 flex-1"
                />
              ) : (
                <Link
                  href={`/d/${doc.id}`}
                  onClick={onNavigate}
                  aria-current={isActive ? "page" : undefined}
                  className="min-w-0 flex-1 px-2 py-1.5"
                >
                  <span className="block truncate text-sm font-medium">
                    {doc.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {getTimeSinceLastSave(new Date(doc.updatedAt).getTime())}
                  </span>
                </Link>
              )}
              {editingId !== doc.id && (
                <div className="flex opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => startRename(doc.id, doc.title)}
                    aria-label={`Rename ${doc.title}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 hover:text-destructive"
                    onClick={() => void handleDelete(doc.id, doc.title)}
                    aria-label={`Delete ${doc.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {documents.length === 0 && (
        <p className="px-2 text-sm text-muted-foreground">No documents yet.</p>
      )}
      {documents.length > 0 && visibleDocuments.length === 0 && (
        <p className="px-2 text-sm text-muted-foreground">No matches.</p>
      )}
    </nav>
  )
}
