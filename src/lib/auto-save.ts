/**
 * Auto-save utility for managing localStorage-based content persistence
 */

const STORAGE_KEY = "typostry_autosave"
const STORAGE_TIMESTAMP_KEY = "typostry_autosave_timestamp"

export interface AutoSaveData {
  content: string
  timestamp: number
}

/**
 * Save content to localStorage
 */
export function saveToLocalStorage(content: string): void {
  try {
    const data: AutoSaveData = {
      content,
      timestamp: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error("Failed to save to localStorage:", error)
  }
}

/**
 * Load content from localStorage
 */
export function loadFromLocalStorage(): AutoSaveData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const data = JSON.parse(stored) as AutoSaveData
    return data
  } catch (error) {
    console.error("Failed to load from localStorage:", error)
    return null
  }
}

/**
 * Clear auto-save data from localStorage
 */
export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_TIMESTAMP_KEY)
  } catch (error) {
    console.error("Failed to clear localStorage:", error)
  }
}

/**
 * Check if there's recoverable content in localStorage
 */
export function hasRecoverableContent(): boolean {
  const data = loadFromLocalStorage()
  return data !== null && data.content.trim().length > 0
}

/**
 * Get formatted time difference for display
 */
export function getTimeSinceLastSave(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
  return "just now"
}
