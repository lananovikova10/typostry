"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  DocumentSnapshot,
  DocumentStore,
  SaveStatus,
} from "@/lib/documents/types"

const BACKUP_DELAY_MS = 300
const MIN_RETRY_MS = 2000
const MAX_RETRY_MS = 30000

interface UseDocumentPersistenceOptions {
  store: DocumentStore
  content: string
  /** Content as last persisted (initial value / server copy) */
  initialContent: string
  /** Server version of initialContent; null for guest drafts */
  initialVersion?: number | null
  enabled?: boolean
}

export interface DocumentPersistence {
  status: SaveStatus
  lastSavedAt: number | null
  /** Remote copy when a save was rejected because the server moved on */
  conflict: DocumentSnapshot | null
  /** Saves immediately (Ctrl/Cmd+S, before navigation) */
  flush: () => Promise<void>
  /** Conflict resolution: save local content over the newer remote version */
  overwriteRemote: () => Promise<void>
  /** Conflict resolution: accept the remote copy; returns its content */
  acceptRemote: () => string | null
}

/**
 * Debounced autosave for the editor, independent of where content is stored.
 * - one save in flight at a time, with a follow-up if content changed meanwhile
 * - backs up unsynced content locally (cloud store) for crash/offline recovery
 * - retries with backoff when offline/erroring, immediately when back online
 * - pauses on version conflicts and deleted documents
 */
export function useDocumentPersistence({
  store,
  content,
  initialContent,
  initialVersion = null,
  enabled = true,
}: UseDocumentPersistenceOptions): DocumentPersistence {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [conflict, setConflict] = useState<DocumentSnapshot | null>(null)

  const contentRef = useRef(content)
  const lastSavedContentRef = useRef(initialContent)
  const versionRef = useRef<number | null>(initialVersion)
  const inFlightRef = useRef<Promise<void> | null>(null)
  const pendingRef = useRef(false)
  const pausedRef = useRef(false)
  const firstDirtyAtRef = useRef<number | null>(null)
  const retryDelayRef = useRef(0)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const backupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const runSaveRef = useRef<() => Promise<void>>(async () => {})

  contentRef.current = content

  const clearTimer = (
    timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
  ) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const scheduleRetry = useCallback(() => {
    clearTimer(retryTimerRef)
    retryDelayRef.current = Math.min(
      MAX_RETRY_MS,
      Math.max(MIN_RETRY_MS, retryDelayRef.current * 2)
    )
    retryTimerRef.current = setTimeout(() => {
      void runSaveRef.current()
    }, retryDelayRef.current)
  }, [])

  const runSave = useCallback(async (): Promise<void> => {
    if (!enabled || pausedRef.current) return

    if (inFlightRef.current) {
      pendingRef.current = true
      return inFlightRef.current
    }

    clearTimer(saveTimerRef)
    clearTimer(retryTimerRef)
    firstDirtyAtRef.current = null

    const snapshot = contentRef.current
    if (snapshot === lastSavedContentRef.current) {
      setStatus((current) =>
        current === "dirty" || current === "offline" || current === "error"
          ? "saved"
          : current
      )
      return
    }

    setStatus("saving")

    const savePromise = (async () => {
      const result = await store.save(snapshot, versionRef.current)

      if (result.ok) {
        lastSavedContentRef.current = snapshot
        if (result.version !== null) versionRef.current = result.version
        retryDelayRef.current = 0
        setLastSavedAt(result.savedAt)
        setStatus(contentRef.current === snapshot ? "saved" : "dirty")
      } else if (result.reason === "conflict") {
        pausedRef.current = true
        setConflict(result.remote)
        setStatus("conflict")
      } else if (result.reason === "deleted") {
        pausedRef.current = true
        setStatus("deleted")
      } else {
        // Keep the content safe on this device until the server is reachable
        store.writeBackup(snapshot, versionRef.current)
        setStatus(result.reason)
        scheduleRetry()
      }
    })()

    inFlightRef.current = savePromise
    try {
      await savePromise
    } finally {
      inFlightRef.current = null
    }

    if (pendingRef.current) {
      pendingRef.current = false
      if (contentRef.current !== lastSavedContentRef.current) {
        await runSaveRef.current()
      }
    }
  }, [enabled, store, scheduleRetry])

  runSaveRef.current = runSave

  // Debounce saves (with a max wait) and back up on every change
  useEffect(() => {
    if (!enabled || pausedRef.current) return
    if (content === lastSavedContentRef.current) return

    setStatus((current) =>
      current === "saving" || current === "offline" || current === "error"
        ? current
        : "dirty"
    )

    if (store.kind === "cloud") {
      clearTimer(backupTimerRef)
      backupTimerRef.current = setTimeout(() => {
        store.writeBackup(contentRef.current, versionRef.current)
      }, BACKUP_DELAY_MS)
    }

    if (firstDirtyAtRef.current === null) firstDirtyAtRef.current = Date.now()
    const elapsed = Date.now() - firstDirtyAtRef.current
    const delay = Math.max(
      0,
      Math.min(store.autosaveDelayMs, store.maxWaitMs - elapsed)
    )

    clearTimer(saveTimerRef)
    saveTimerRef.current = setTimeout(() => {
      void runSaveRef.current()
    }, delay)
  }, [content, enabled, store])

  // Retry as soon as the network is back; flush when the tab is hidden
  useEffect(() => {
    if (!enabled) return

    const handleOnline = () => {
      retryDelayRef.current = 0
      void runSaveRef.current()
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") void runSaveRef.current()
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (store.kind !== "cloud") return
      const hasUnsavedChanges =
        contentRef.current !== lastSavedContentRef.current ||
        inFlightRef.current !== null
      if (hasUnsavedChanges) {
        // Backup survives the reload even if the save does not
        store.writeBackup(contentRef.current, versionRef.current)
        event.preventDefault()
        event.returnValue = ""
      }
    }

    window.addEventListener("online", handleOnline)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("online", handleOnline)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [enabled, store])

  // Save pending changes when the editor unmounts (e.g. switching documents)
  useEffect(() => {
    return () => {
      clearTimer(saveTimerRef)
      clearTimer(backupTimerRef)
      clearTimer(retryTimerRef)
      void runSaveRef.current()
    }
  }, [])

  const flush = useCallback(() => runSaveRef.current(), [])

  const overwriteRemote = useCallback(async () => {
    if (!conflict) return
    versionRef.current = conflict.version
    pausedRef.current = false
    setConflict(null)
    await runSaveRef.current()
  }, [conflict])

  const acceptRemote = useCallback((): string | null => {
    if (!conflict) return null
    versionRef.current = conflict.version
    lastSavedContentRef.current = conflict.content
    pausedRef.current = false
    store.clearBackup()
    setConflict(null)
    setStatus("saved")
    setLastSavedAt(new Date(conflict.updatedAt).getTime())
    return conflict.content
  }, [conflict, store])

  return { status, lastSavedAt, conflict, flush, overwriteRemote, acceptRemote }
}
