import {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
  hasRecoverableContent,
  getTimeSinceLastSave,
} from "../auto-save"

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

describe("Auto-save utilities", () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe("saveToLocalStorage", () => {
    it("should save content to localStorage", () => {
      const content = "# Test Content\n\nThis is a test."
      saveToLocalStorage(content)

      const stored = localStorageMock.getItem("typostry_autosave")
      expect(stored).toBeTruthy()

      const parsed = JSON.parse(stored!)
      expect(parsed.content).toBe(content)
      expect(parsed.timestamp).toBeDefined()
      expect(typeof parsed.timestamp).toBe("number")
    })

    it("should update timestamp on each save", async () => {
      saveToLocalStorage("First content")
      const first = loadFromLocalStorage()

      await new Promise((resolve) => setTimeout(resolve, 10))

      saveToLocalStorage("Second content")
      const second = loadFromLocalStorage()

      expect(second?.timestamp).toBeGreaterThan(first?.timestamp || 0)
    })
  })

  describe("loadFromLocalStorage", () => {
    it("should load saved content", () => {
      const content = "# Test Content"
      saveToLocalStorage(content)

      const loaded = loadFromLocalStorage()
      expect(loaded).toBeTruthy()
      expect(loaded?.content).toBe(content)
    })

    it("should return null when no data exists", () => {
      const loaded = loadFromLocalStorage()
      expect(loaded).toBeNull()
    })

    it("should handle corrupted data gracefully", () => {
      localStorageMock.setItem("typostry_autosave", "invalid json")
      const loaded = loadFromLocalStorage()
      expect(loaded).toBeNull()
    })
  })

  describe("clearLocalStorage", () => {
    it("should remove saved content", () => {
      saveToLocalStorage("Test content")
      expect(loadFromLocalStorage()).toBeTruthy()

      clearLocalStorage()
      expect(loadFromLocalStorage()).toBeNull()
    })
  })

  describe("hasRecoverableContent", () => {
    it("should return true when content exists", () => {
      saveToLocalStorage("Test content")
      expect(hasRecoverableContent()).toBe(true)
    })

    it("should return false when no content exists", () => {
      expect(hasRecoverableContent()).toBe(false)
    })

    it("should return false for empty content", () => {
      saveToLocalStorage("")
      expect(hasRecoverableContent()).toBe(false)
    })

    it("should return false for whitespace-only content", () => {
      saveToLocalStorage("   \n  \t  ")
      expect(hasRecoverableContent()).toBe(false)
    })
  })

  describe("getTimeSinceLastSave", () => {
    it("should return 'just now' for recent timestamps", () => {
      const now = Date.now()
      expect(getTimeSinceLastSave(now)).toBe("just now")
    })

    it("should return minutes ago", () => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
      expect(getTimeSinceLastSave(fiveMinutesAgo)).toBe("5 minutes ago")
    })

    it("should return hours ago", () => {
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
      expect(getTimeSinceLastSave(twoHoursAgo)).toBe("2 hours ago")
    })

    it("should return days ago", () => {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000
      expect(getTimeSinceLastSave(threeDaysAgo)).toBe("3 days ago")
    })

    it("should use singular form for 1 unit", () => {
      const oneMinuteAgo = Date.now() - 60 * 1000
      expect(getTimeSinceLastSave(oneMinuteAgo)).toBe("1 minute ago")

      const oneHourAgo = Date.now() - 60 * 60 * 1000
      expect(getTimeSinceLastSave(oneHourAgo)).toBe("1 hour ago")

      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
      expect(getTimeSinceLastSave(oneDayAgo)).toBe("1 day ago")
    })
  })
})
