"use client"

import { useCallback, useMemo, useRef } from "react"

import { createCloudStore } from "@/lib/documents/cloud-store"
import { DEFAULT_DOCUMENT_TITLE, titleFromFileName } from "@/lib/documents/title"
import { DocumentSnapshot } from "@/lib/documents/types"
import { getBrowserClient } from "@/lib/supabase/client"
import { UserMenu } from "@/components/auth/user-menu"
import { useDocuments } from "@/components/documents/documents-provider"
import { MarkdownEditor } from "@/components/markdown-editor"

interface DocumentWorkspaceProps {
  document: DocumentSnapshot
}

/**
 * Cloud document editor. Rendered with key={document.id}, so switching
 * documents remounts the editor (fresh undo history, flushes pending saves).
 */
export function DocumentWorkspace({ document }: DocumentWorkspaceProps) {
  const { documents, create, touch } = useDocuments()
  const store = useMemo(
    () => createCloudStore(getBrowserClient(), document.id),
    [document.id]
  )
  const hasTouchedRef = useRef(false)

  const title =
    documents.find((doc) => doc.id === document.id)?.title ?? document.title

  const cloudDocument = useMemo(
    () => ({ id: document.id, title, version: document.version }),
    [document.id, title, document.version]
  )

  const handleChange = useCallback(() => {
    if (!hasTouchedRef.current) {
      hasTouchedRef.current = true
      touch(document.id)
    }
  }, [document.id, touch])

  const handleNewDocument = useCallback(() => {
    void create({ title: DEFAULT_DOCUMENT_TITLE, content: "" })
  }, [create])

  const handleImportFile = useCallback(
    (content: string, fileName: string) => {
      void create({ title: titleFromFileName(fileName), content })
    },
    [create]
  )

  const handleSaveCopy = useCallback(
    (content: string) => create({ title: `${title} (copy)`, content }),
    [create, title]
  )

  return (
    <MarkdownEditor
      initialValue={document.content}
      cloudDocument={cloudDocument}
      store={store}
      onChange={handleChange}
      onNewDocument={handleNewDocument}
      onImportFile={handleImportFile}
      onSaveCopy={handleSaveCopy}
      toolbarEndSlot={<UserMenu />}
    />
  )
}
