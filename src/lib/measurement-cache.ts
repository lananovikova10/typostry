/**
 * Measurement Cache for Virtualized Preview
 *
 * Caches measured heights of content blocks keyed by block signature
 * to reduce layout thrash when scrolling large tables/diagrams.
 *
 * Block signature = hash of (content type + content length + key content features)
 */

interface BlockSignature {
  type: string
  length: number
  features: string // Key features like table rows, code lines, etc.
}

interface CachedMeasurement {
  height: number
  timestamp: number
  hitCount: number
}

/**
 * Simple hash function for generating block signatures
 */
function hashSignature(signature: BlockSignature): string {
  const str = `${signature.type}:${signature.length}:${signature.features}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(36)
}

/**
 * Extract key features from content for signature generation
 */
function extractFeatures(content: string, type: string): string {
  const tempDiv = document.createElement("div")
  tempDiv.innerHTML = content
  const element = tempDiv.firstElementChild

  if (!element) return "0"

  switch (type) {
    case "table": {
      const rows = element.querySelectorAll("tr").length
      const cols = element.querySelector("tr")?.querySelectorAll("td, th").length || 0
      return `${rows}x${cols}`
    }
    case "code": {
      const lines = element.textContent?.split("\n").length || 1
      return `${lines}L`
    }
    case "list": {
      const items = element.querySelectorAll("li").length
      const nested = element.querySelectorAll("ul, ol").length
      return `${items}i${nested}n`
    }
    case "heading": {
      const level = element.tagName.toLowerCase()
      return level
    }
    default: {
      const lines = element.textContent?.split("\n").length || 1
      return `${lines}L`
    }
  }
}

export class MeasurementCache {
  private cache: Map<string, CachedMeasurement>
  private maxSize: number
  private maxAge: number // milliseconds

  constructor(maxSize = 1000, maxAge = 300000) {
    // Default: 1000 entries, 5 minutes max age
    this.cache = new Map()
    this.maxSize = maxSize
    this.maxAge = maxAge
  }

  /**
   * Generate a signature for a content block
   */
  generateSignature(content: string, type: string): string {
    const features = extractFeatures(content, type)
    const signature: BlockSignature = {
      type,
      length: content.length,
      features,
    }
    return hashSignature(signature)
  }

  /**
   * Get cached height for a block signature
   */
  get(signature: string): number | null {
    const cached = this.cache.get(signature)
    if (!cached) return null

    // Check if cache entry is too old
    const age = Date.now() - cached.timestamp
    if (age > this.maxAge) {
      this.cache.delete(signature)
      return null
    }

    // Update hit count
    cached.hitCount++
    return cached.height
  }

  /**
   * Store measured height for a block signature
   */
  set(signature: string, height: number): void {
    // Evict old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(signature, {
      height,
      timestamp: Date.now(),
      hitCount: 0,
    })
  }

  /**
   * Check if a signature exists in cache
   */
  has(signature: string): boolean {
    const cached = this.cache.get(signature)
    if (!cached) return false

    const age = Date.now() - cached.timestamp
    return age <= this.maxAge
  }

  /**
   * Clear all cached measurements
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.entries()).map(([sig, data]) => ({
        signature: sig,
        height: data.height,
        age: Date.now() - data.timestamp,
        hitCount: data.hitCount,
      })),
    }
  }

  /**
   * Evict oldest entries (by timestamp)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, value] of Array.from(this.cache.entries())) {
      if (value.timestamp < oldestTime) {
        oldestTime = value.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Evict least recently used entries (by hit count)
   */
  evictLRU(): void {
    let lruKey: string | null = null
    let minHits = Infinity

    for (const [key, value] of Array.from(this.cache.entries())) {
      if (value.hitCount < minHits) {
        minHits = value.hitCount
        lruKey = key
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey)
    }
  }
}

// Singleton instance for global use
export const measurementCache = new MeasurementCache()
