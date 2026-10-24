"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { usePathname, useRouter } from "next/navigation"

import { clearDocumentBackup } from "@/lib/documents/backup"
import {
  createDocument,
  deleteDocument,
  renameDocument,
} from "@/lib/documents/repository"
import { DocumentSummary } from "@/lib/documents/types"
import { getBrowserClient } from "@/lib/supabase/client"

interface DocumentsContextValue {
  documents: DocumentSummary[]
  activeDocumentId: string | null
  /** Creates a document and opens it */
  create: (input: { title: string; content: string }) => Promise<void>
  rename: (id: string, title: string) => Promise<void>
  remove: (id: string) => Promise<void>
  /** Moves a document to the top after it was edited */
  touch: (id: string) => void
}

const DocumentsContext = createContext<DocumentsContextValue | null>(null)

function sortByUpdatedAt(documents: DocumentSummary[]): DocumentSummary[] {
  return [...documents].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

interface DocumentsProviderProps {
  initialDocuments: DocumentSummary[]
  children: React.ReactNode
}

export function DocumentsProvider({
  initialDocuments,
  children,
}: DocumentsProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [documents, setDocuments] = useState(initialDocuments)

  // Server data wins after a router.refresh()
  useEffect(() => {
    setDocuments(initialDocuments)
  }, [initialDocuments])

  const activeDocumentId = pathname?.startsWith("/d/")
    ? pathname.slice("/d/".length).split("/")[0] || null
    : null

  const create = useCallback(
    async (input: { title: string; content: string }) => {
      try {
        const created = await createDocument(getBrowserClient(), input)
        setDocuments((current) => [
          { id: created.id, title: created.title, updatedAt: created.updatedAt },
          ...current,
        ])
        router.push(`/d/${created.id}`)
      } catch (error) {
        console.error("Failed to create document:", error)
        window.alert("Couldn't create the document. Please try again.")
      }
    },
    [router]
  )

  const rename = useCallback(
    async (id: string, title: string) => {
      const previousTitle = documents.find((doc) => doc.id === id)?.title
      const setTitle = (value: string) =>
        setDocuments((current) =>
          current.map((doc) => (doc.id === id ? { ...doc, title: value } : doc))
        )

      setTitle(title)
      try {
        const renamed = await renameDocument(getBrowserClient(), id, title)
        setDocuments((current) =>
          sortByUpdatedAt(current.map((doc) => (doc.id === id ? renamed : doc)))
        )
      } catch (error) {
        console.error("Failed to rename document:", error)
        if (previousTitle !== undefined) setTitle(previousTitle)
        window.alert("Couldn't rename the document. Please try again.")
      }
    },
    [documents]
  )

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteDocument(getBrowserClient(), id)
      } catch (error) {
        console.error("Failed to delete document:", error)
        window.alert("Couldn't delete the document. Please try again.")
        return
      }

      clearDocumentBackup(id)
      const remaining = documents.filter((doc) => doc.id !== id)
      setDocuments(remaining)

      if (id === activeDocumentId) {
        router.push(remaining[0] ? `/d/${remaining[0].id}` : "/")
      }
    },
    [documents, activeDocumentId, router]
  )

  const touch = useCallback((id: string) => {
    setDocuments((current) => {
      if (current[0]?.id === id) return current
      return sortByUpdatedAt(
        current.map((doc) =>
          doc.id === id ? { ...doc, updatedAt: new Date().toISOString() } : doc
        )
      )
    })
  }, [])

  const value = useMemo(
    () => ({ documents, activeDocumentId, create, rename, remove, touch }),
    [documents, activeDocumentId, create, rename, remove, touch]
  )

  return (
    <DocumentsContext.Provider value={value}>
      {children}
    </DocumentsContext.Provider>
  )
}

export function useDocuments(): DocumentsContextValue {
  const context = useContext(DocumentsContext)
  if (!context) {
    throw new Error("useDocuments must be used within a DocumentsProvider")
  }
  return context
}
