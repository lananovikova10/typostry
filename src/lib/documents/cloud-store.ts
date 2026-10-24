import { TypedSupabaseClient } from "@/lib/supabase/client"

import {
  clearDocumentBackup,
  readDocumentBackup,
  writeDocumentBackup,
} from "./backup"
import { saveDocumentContent } from "./repository"
import { DocumentStore } from "./types"

/**
 * Signed-in mode: saves to Supabase with version checks, and keeps a
 * per-document localStorage backup until the server has the latest content.
 */
export function createCloudStore(
  supabase: TypedSupabaseClient,
  documentId: string
): DocumentStore {
  return {
    kind: "cloud",
    autosaveDelayMs: 1500,
    maxWaitMs: 10000,
    async save(content, baseVersion) {
      if (baseVersion === null) {
        return { ok: false, reason: "error", error: new Error("Missing base version") }
      }

      const result = await saveDocumentContent(
        supabase,
        documentId,
        content,
        baseVersion
      )

      // Only drop the backup if it holds exactly what the server now has
      if (result.ok && readDocumentBackup(documentId)?.content === content) {
        clearDocumentBackup(documentId)
      }

      return result
    },
    readBackup() {
      return readDocumentBackup(documentId)
    },
    writeBackup(content, baseVersion) {
      writeDocumentBackup(documentId, content, baseVersion)
    },
    clearBackup() {
      clearDocumentBackup(documentId)
    },
  }
}
