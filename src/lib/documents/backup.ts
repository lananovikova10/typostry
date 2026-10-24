import { BackupData } from "./types"

const BACKUP_PREFIX = "typostry_doc_backup:"

// Set during an intentional sign-out so late writes (beforeunload, unmount)
// can't leave document copies behind after they were cleared
let backupsSuspended = false

function backupKey(documentId: string): string {
  return `${BACKUP_PREFIX}${documentId}`
}

/**
 * Per-document backups of cloud content that has not reached the server yet
 * (offline, errors, tab closed mid-save).
 */
export function readDocumentBackup(documentId: string): BackupData | null {
  try {
    const stored = localStorage.getItem(backupKey(documentId))
    if (!stored) return null
    const data = JSON.parse(stored) as BackupData
    return typeof data.content === "string" ? data : null
  } catch {
    return null
  }
}

export function writeDocumentBackup(
  documentId: string,
  content: string,
  baseVersion: number | null
): void {
  if (backupsSuspended) return
  try {
    const data: BackupData = { content, baseVersion, savedAt: Date.now() }
    localStorage.setItem(backupKey(documentId), JSON.stringify(data))
  } catch (error) {
    console.error("Failed to write document backup:", error)
  }
}

export function clearDocumentBackup(documentId: string): void {
  try {
    localStorage.removeItem(backupKey(documentId))
  } catch {
    // ignore
  }
}

export function listBackupDocumentIds(): string[] {
  try {
    const ids: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(BACKUP_PREFIX)) ids.push(key.slice(BACKUP_PREFIX.length))
    }
    return ids
  } catch {
    return []
  }
}

/** Removes every cloud backup, e.g. on sign-out from a shared machine */
export function clearAllDocumentBackups(): void {
  listBackupDocumentIds().forEach(clearDocumentBackup)
}

/**
 * Stops all further backup writes for the rest of this page's lifetime and
 * removes existing ones. Call right before signing out.
 */
export function suspendAndClearDocumentBackups(): void {
  backupsSuspended = true
  clearAllDocumentBackups()
}

export function areDocumentBackupsSuspended(): boolean {
  return backupsSuspended
}
