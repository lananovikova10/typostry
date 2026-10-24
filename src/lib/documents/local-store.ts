import {
  clearLocalStorage,
  hasRecoverableContent,
  loadFromLocalStorage,
  saveToLocalStorage,
} from "@/lib/auto-save"

import { DocumentStore } from "./types"

/**
 * Guest mode: the single localStorage autosave slot is both the "save target"
 * and the recovery backup.
 */
export function createLocalStore(): DocumentStore {
  return {
    kind: "local",
    autosaveDelayMs: 2000,
    maxWaitMs: 10000,
    async save(content) {
      if (content.trim().length > 0) {
        saveToLocalStorage(content)
      }
      return { ok: true, version: null, savedAt: Date.now() }
    },
    readBackup() {
      if (!hasRecoverableContent()) return null
      const data = loadFromLocalStorage()
      if (!data) return null
      return { content: data.content, baseVersion: null, savedAt: data.timestamp }
    },
    writeBackup() {
      // save() already writes to the backup slot
    },
    clearBackup() {
      clearLocalStorage()
    },
  }
}
