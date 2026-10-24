"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { areDocumentBackupsSuspended } from "@/lib/documents/backup"
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
 * - backs up unsynced content locally (cloud store) for crash/offline recovery,
 *   including while saving is paused by a conflict or deletion
 * - retries with backoff when offline/erroring, immediately when back online
 * - pauses server saves on version conflicts and deleted documents
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
  const mountedRef = useRef(true)
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

  const backupLatest = useCallback(() => {
    if (store.kind !== "cloud") return
    if (contentRef.current === lastSavedContentRef.current) return
    store.writeBackup(contentRef.current, versionRef.current)
  }, [store])

  const scheduleRetry = useCallback(() => {
    clearTimer(retryTimerRef)
    // A departed editor makes one final attempt on unmount, never retries
    if (!mountedRef.current) return
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
    pendingRef.current = false

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
    let succeeded = false

    const savePromise = (async () => {
      const result = await store.save(snapshot, versionRef.current)

      if (result.ok) {
        succeeded = true
        lastSavedContentRef.current = snapshot
        if (result.version !== null) versionRef.current = result.version
        retryDelayRef.current = 0
        setLastSavedAt(result.savedAt)
        setStatus(contentRef.current === snapshot ? "saved" : "dirty")
      } else if (result.reason === "conflict") {
        pausedRef.current = true
        backupLatest()
        setConflict(result.remote)
        setStatus("conflict")
      } else if (result.reason === "deleted") {
        pausedRef.current = true
        backupLatest()
        setStatus("deleted")
      } else {
        // Keep the newest content safe on this device until the server is reachable
        backupLatest()
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

    // Content changed while saving. Follow up if a save was requested
    // meanwhile, or if nothing else will (e.g. an undo back to the old
    // baseline didn't schedule a debounce)
    const needsFollowUp =
      succeeded &&
      contentRef.current !== lastSavedContentRef.current &&
      (pendingRef.current || saveTimerRef.current === null)
    pendingRef.current = false
    if (needsFollowUp) await runSaveRef.current()
  }, [enabled, store, scheduleRetry, backupLatest])

  runSaveRef.current = runSave

  // Debounce saves (with a max wait) and back up on every change
  useEffect(() => {
    if (!enabled) return
    if (content === lastSavedContentRef.current) return

    // Backups continue while saving is paused, so no edit is lost
    if (store.kind === "cloud") {
      clearTimer(backupTimerRef)
      backupTimerRef.current = setTimeout(backupLatest, BACKUP_DELAY_MS)
    }

    if (pausedRef.current) return

    setStatus((current) =>
      current === "saving" || current === "offline" || current === "error"
        ? current
        : "dirty"
    )

    if (firstDirtyAtRef.current === null) firstDirtyAtRef.current = Date.now()
    const elapsed = Date.now() - firstDirtyAtRef.current
    const delay = Math.max(
      0,
      Math.min(store.autosaveDelayMs, store.maxWaitMs - elapsed)
    )

    clearTimer(saveTimerRef)
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null
      void runSaveRef.current()
    }, delay)
  }, [content, enabled, store, backupLatest])

  // Retry as soon as the network is back; flush when the tab is hidden or the
  // page is closed, so the last seconds of typing are not lost
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
      // Intentional sign-out already cleared local copies
      if (store.kind !== "cloud" || areDocumentBackupsSuspended()) return
      const hasUnsavedChanges =
        contentRef.current !== lastSavedContentRef.current ||
        inFlightRef.current !== null
      if (hasUnsavedChanges) {
        // Backup survives the reload even if the save does not
        backupLatest()
        event.preventDefault()
        event.returnValue = ""
      }
    }

    const handlePageHide = () => void runSaveRef.current()

    window.addEventListener("online", handleOnline)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("pagehide", handlePageHide)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("online", handleOnline)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("pagehide", handlePageHide)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [enabled, store, backupLatest])

  // On unmount (e.g. switching documents): keep a local copy, then one final save
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      backupLatest()
      clearTimer(saveTimerRef)
      clearTimer(backupTimerRef)
      clearTimer(retryTimerRef)
      void runSaveRef.current()
    }
  }, [backupLatest])

  const flush = useCallback(() => runSaveRef.current(), [])

  const overwriteRemote = useCallback(async () => {
    if (!conflict) return
    // Rebase on the remote copy so the save compares against what the server has
    versionRef.current = conflict.version
    lastSavedContentRef.current = conflict.content
    pausedRef.current = false
    setConflict(null)
    if (contentRef.current === conflict.content) {
      store.clearBackup()
      setStatus("saved")
      return
    }
    setStatus("dirty")
    await runSaveRef.current()
  }, [conflict, store])

  const acceptRemote = useCallback((): string | null => {
    if (!conflict) return null
    versionRef.current = conflict.version
    lastSavedContentRef.current = conflict.content
    pausedRef.current = false
    clearTimer(backupTimerRef)
    store.clearBackup()
    setConflict(null)
    setStatus("saved")
    setLastSavedAt(new Date(conflict.updatedAt).getTime())
    return conflict.content
  }, [conflict, store])

  return { status, lastSavedAt, conflict, flush, overwriteRemote, acceptRemote }
}
