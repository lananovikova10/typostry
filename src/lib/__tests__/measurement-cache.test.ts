import { MeasurementCache } from "../measurement-cache"

describe("MeasurementCache", () => {
  let cache: MeasurementCache

  beforeEach(() => {
    cache = new MeasurementCache(10, 1000) // Small cache for testing
  })

  afterEach(() => {
    cache.clear()
  })

  describe("generateSignature", () => {
    it("should generate consistent signatures for identical content", () => {
      const content1 = "<table><tr><td>A</td><td>B</td></tr></table>"
      const content2 = "<table><tr><td>A</td><td>B</td></tr></table>"

      const sig1 = cache.generateSignature(content1, "table")
      const sig2 = cache.generateSignature(content2, "table")

      expect(sig1).toBe(sig2)
    })

    it("should generate different signatures for different content types", () => {
      const content = "<div>Same content</div>"

      const sig1 = cache.generateSignature(content, "text")
      const sig2 = cache.generateSignature(content, "code")

      expect(sig1).not.toBe(sig2)
    })

    it("should generate different signatures for tables with different dimensions", () => {
      const table1 = "<table><tr><td>A</td></tr></table>"
      const table2 = "<table><tr><td>A</td><td>B</td></tr></table>"

      const sig1 = cache.generateSignature(table1, "table")
      const sig2 = cache.generateSignature(table2, "table")

      expect(sig1).not.toBe(sig2)
    })

    it("should generate different signatures for code blocks with different line counts", () => {
      const code1 = "<pre><code>line1\nline2</code></pre>"
      const code2 = "<pre><code>line1\nline2\nline3</code></pre>"

      const sig1 = cache.generateSignature(code1, "code")
      const sig2 = cache.generateSignature(code2, "code")

      expect(sig1).not.toBe(sig2)
    })
  })

  describe("set and get", () => {
    it("should store and retrieve height measurements", () => {
      const signature = cache.generateSignature("<div>Test</div>", "text")

      cache.set(signature, 100)
      const height = cache.get(signature)

      expect(height).toBe(100)
    })

    it("should return null for non-existent signatures", () => {
      const height = cache.get("non-existent-signature")
      expect(height).toBeNull()
    })

    it("should update hit count on cache hits", () => {
      const signature = cache.generateSignature("<div>Test</div>", "text")

      cache.set(signature, 100)
      cache.get(signature)
      cache.get(signature)

      const stats = cache.getStats()
      const entry = stats.entries.find((e) => e.signature === signature)

      expect(entry?.hitCount).toBe(2)
    })
  })

  describe("has", () => {
    it("should return true for cached signatures", () => {
      const signature = cache.generateSignature("<div>Test</div>", "text")

      cache.set(signature, 100)

      expect(cache.has(signature)).toBe(true)
    })

    it("should return false for non-existent signatures", () => {
      expect(cache.has("non-existent-signature")).toBe(false)
    })
  })

  describe("cache eviction", () => {
    it("should evict oldest entry when cache is full", () => {
      // Fill cache to max size (10 entries)
      for (let i = 0; i < 10; i++) {
        const signature = cache.generateSignature(`<div>Test ${i}</div>`, "text")
        cache.set(signature, 100 + i)
      }

      const firstSignature = cache.generateSignature("<div>Test 0</div>", "text")
      expect(cache.has(firstSignature)).toBe(true)

      // Add one more to trigger eviction
      const newSignature = cache.generateSignature("<div>Test 10</div>", "text")
      cache.set(newSignature, 200)

      // First entry should be evicted
      expect(cache.has(firstSignature)).toBe(false)
      expect(cache.has(newSignature)).toBe(true)
    })

    it("should evict LRU entry", () => {
      const sig1 = cache.generateSignature("<div>Test 1</div>", "text")
      const sig2 = cache.generateSignature("<div>Test 2</div>", "text")
      const sig3 = cache.generateSignature("<div>Test 3</div>", "text")

      cache.set(sig1, 100)
      cache.set(sig2, 200)
      cache.set(sig3, 300)

      // Access sig1 and sig2 to increase hit count
      cache.get(sig1)
      cache.get(sig1)
      cache.get(sig2)

      // sig3 has 0 hits, should be evicted
      cache.evictLRU()

      expect(cache.has(sig1)).toBe(true)
      expect(cache.has(sig2)).toBe(true)
      expect(cache.has(sig3)).toBe(false)
    })
  })

  describe("clear", () => {
    it("should remove all cached entries", () => {
      const sig1 = cache.generateSignature("<div>Test 1</div>", "text")
      const sig2 = cache.generateSignature("<div>Test 2</div>", "text")

      cache.set(sig1, 100)
      cache.set(sig2, 200)

      expect(cache.getStats().size).toBe(2)

      cache.clear()

      expect(cache.getStats().size).toBe(0)
      expect(cache.has(sig1)).toBe(false)
      expect(cache.has(sig2)).toBe(false)
    })
  })

  describe("cache expiration", () => {
    it("should expire old entries", async () => {
      const shortCache = new MeasurementCache(100, 100) // 100ms expiration
      const signature = shortCache.generateSignature("<div>Test</div>", "text")

      shortCache.set(signature, 100)
      expect(shortCache.has(signature)).toBe(true)

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150))

      expect(shortCache.has(signature)).toBe(false)
      expect(shortCache.get(signature)).toBeNull()
    })
  })

  describe("getStats", () => {
    it("should return cache statistics", () => {
      const sig1 = cache.generateSignature("<div>Test 1</div>", "text")
      const sig2 = cache.generateSignature("<div>Test 2</div>", "text")

      cache.set(sig1, 100)
      cache.set(sig2, 200)
      cache.get(sig1)

      const stats = cache.getStats()

      expect(stats.size).toBe(2)
      expect(stats.maxSize).toBe(10)
      expect(stats.entries).toHaveLength(2)
      expect(stats.entries[0].height).toBe(100)
      expect(stats.entries[1].height).toBe(200)
    })
  })

  describe("real-world scenarios", () => {
    it("should handle identical tables efficiently", () => {
      const tableHtml = `
        <table>
          <tr><td>A</td><td>B</td><td>C</td></tr>
          <tr><td>1</td><td>2</td><td>3</td></tr>
          <tr><td>4</td><td>5</td><td>6</td></tr>
        </table>
      `

      // First table - measure and cache
      const sig1 = cache.generateSignature(tableHtml, "table")
      cache.set(sig1, 150)

      // Second identical table - should use cached value
      const sig2 = cache.generateSignature(tableHtml, "table")
      const cachedHeight = cache.get(sig2)

      expect(sig1).toBe(sig2)
      expect(cachedHeight).toBe(150)
    })

    it("should differentiate tables with different structure", () => {
      const table3x3 = `
        <table>
          <tr><td>A</td><td>B</td><td>C</td></tr>
          <tr><td>1</td><td>2</td><td>3</td></tr>
          <tr><td>4</td><td>5</td><td>6</td></tr>
        </table>
      `

      const table2x2 = `
        <table>
          <tr><td>A</td><td>B</td></tr>
          <tr><td>1</td><td>2</td></tr>
        </table>
      `

      const sig1 = cache.generateSignature(table3x3, "table")
      const sig2 = cache.generateSignature(table2x2, "table")

      cache.set(sig1, 150)
      cache.set(sig2, 100)

      expect(sig1).not.toBe(sig2)
      expect(cache.get(sig1)).toBe(150)
      expect(cache.get(sig2)).toBe(100)
    })

    it("should handle code blocks with different line counts", () => {
      const code10Lines = "<pre><code>" + "line\n".repeat(10) + "</code></pre>"
      const code20Lines = "<pre><code>" + "line\n".repeat(20) + "</code></pre>"

      const sig1 = cache.generateSignature(code10Lines, "code")
      const sig2 = cache.generateSignature(code20Lines, "code")

      cache.set(sig1, 200)
      cache.set(sig2, 400)

      expect(sig1).not.toBe(sig2)
      expect(cache.get(sig1)).toBe(200)
      expect(cache.get(sig2)).toBe(400)
    })
  })
})
