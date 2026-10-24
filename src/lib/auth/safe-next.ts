const PLACEHOLDER_ORIGIN = "http://typostry.invalid"

/**
 * Sanitizes a post-login redirect target so it can only point inside the app.
 * Rejects absolute URLs, protocol-relative URLs ("//evil.com") and
 * backslash tricks ("/\evil.com").
 */
export function safeNextPath(
  raw: string | null | undefined,
  fallback = "/"
): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return fallback
  }

  try {
    const url = new URL(raw, PLACEHOLDER_ORIGIN)
    if (url.origin !== PLACEHOLDER_ORIGIN) return fallback
    const normalized = `${url.pathname}${url.search}${url.hash}`
    // Dot segments can normalize into a protocol-relative URL ("/a/..//evil.com")
    if (normalized.startsWith("//") || normalized.startsWith("/\\")) {
      return fallback
    }
    return normalized
  } catch {
    return fallback
  }
}
