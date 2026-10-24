import { MAX_TITLE_LENGTH } from "./schemas"

export const DEFAULT_DOCUMENT_TITLE = "Untitled"

/**
 * Derives a document title from markdown: the first "# H1", otherwise the
 * fallback.
 */
export function deriveTitle(
  markdown: string,
  fallback = DEFAULT_DOCUMENT_TITLE
): string {
  const match = /^#\s+(.+?)\s*#*\s*$/m.exec(markdown)
  const title = match?.[1]?.trim()
  return normalizeTitle(title || fallback)
}

/** Trims and clamps a title so it satisfies the database CHECK constraint */
export function normalizeTitle(title: string): string {
  const trimmed = title.trim().slice(0, MAX_TITLE_LENGTH)
  return trimmed.length > 0 ? trimmed : DEFAULT_DOCUMENT_TITLE
}

/** "notes.md" -> "notes" */
export function titleFromFileName(fileName: string): string {
  return normalizeTitle(fileName.replace(/\.(md|markdown|txt)$/i, ""))
}
