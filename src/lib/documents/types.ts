export type SaveStatus =
  | "idle"
  | "dirty"
  | "saving"
  | "saved"
  | "offline"
  | "error"
  | "conflict"
  | "deleted"

export type StorageKind = "local" | "cloud"

export interface DocumentSummary {
  id: string
  title: string
  updatedAt: string
}

export interface DocumentSnapshot extends DocumentSummary {
  content: string
  version: number
}

export type SaveResult =
  | { ok: true; version: number | null; savedAt: number }
  | { ok: false; reason: "conflict"; remote: DocumentSnapshot }
  | { ok: false; reason: "deleted" | "offline" | "error"; error?: unknown }

export interface BackupData {
  content: string
  /** Server version the backup was based on (null for guest drafts) */
  baseVersion: number | null
  savedAt: number
}

/**
 * Where the editor's content is persisted. The editor only talks to this
 * interface, so guest (localStorage) and cloud (Supabase) modes share one
 * autosave pipeline (see useDocumentPersistence).
 */
export interface DocumentStore {
  readonly kind: StorageKind
  /** Debounce after the last keystroke */
  readonly autosaveDelayMs: number
  /** Upper bound between saves during continuous typing */
  readonly maxWaitMs: number
  save(content: string, baseVersion: number | null): Promise<SaveResult>
  /** Unsynced content kept on this device, used for crash recovery */
  readBackup(): BackupData | null
  writeBackup(content: string, baseVersion: number | null): void
  clearBackup(): void
}
