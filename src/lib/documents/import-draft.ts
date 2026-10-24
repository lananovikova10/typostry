import { WELCOME_MARKDOWN } from "@/config/welcome-document"
import { hasRecoverableContent, loadFromLocalStorage } from "@/lib/auto-save"

const DECISION_PREFIX = "typostry_draft_import:"

export interface PendingDraft {
  content: string
  timestamp: number
}

function decisionKey(userId: string): string {
  return `${DECISION_PREFIX}${userId}`
}

/**
 * Returns the guest draft that a newly signed-in user could import, unless it
 * is just the welcome text or the user already decided about this draft.
 */
export function getPendingDraft(userId: string): PendingDraft | null {
  try {
    if (!hasRecoverableContent()) return null
    const data = loadFromLocalStorage()
    if (!data || data.content.trim() === WELCOME_MARKDOWN.trim()) return null
    if (localStorage.getItem(decisionKey(userId)) === String(data.timestamp)) {
      return null
    }
    return { content: data.content, timestamp: data.timestamp }
  } catch {
    return null
  }
}

/** Remembers that the user imported or kept this specific draft */
export function rememberDraftDecision(userId: string, draft: PendingDraft): void {
  try {
    localStorage.setItem(decisionKey(userId), String(draft.timestamp))
  } catch {
    // ignore
  }
}
