// Import testing-library jest-dom matchers
import '@testing-library/jest-dom'

// Mock matchMedia for component tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock resize observer
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock

// Mock IntersectionObserver (not implemented in jsdom)
class IntersectionObserverMock {
  constructor(callback, options = {}) {
    this.callback = callback
    this.root = options.root || null
    this.rootMargin = options.rootMargin || '0px'
    this.thresholds = Array.isArray(options.threshold)
      ? options.threshold
      : [options.threshold || 0]
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

window.IntersectionObserver = IntersectionObserverMock
global.IntersectionObserver = IntersectionObserverMock

// jsdom does not implement scrollIntoView
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = jest.fn()
}

// jsdom does not implement DragEvent / DataTransfer
if (typeof window.DataTransfer === 'undefined') {
  class DataTransferMock {
    constructor() {
      this.data = {}
      this.dropEffect = 'none'
      this.effectAllowed = 'all'
      this.files = []
      this.items = []
      this.types = []
    }
    setData(format, data) {
      this.data[format] = data
      if (!this.types.includes(format)) this.types.push(format)
    }
    getData(format) {
      return this.data[format] || ''
    }
    clearData(format) {
      if (format) delete this.data[format]
      else this.data = {}
    }
    setDragImage() {}
  }
  window.DataTransfer = DataTransferMock
  global.DataTransfer = DataTransferMock
}

if (typeof window.DragEvent === 'undefined') {
  class DragEventMock extends MouseEvent {
    constructor(type, init = {}) {
      super(type, init)
      this.dataTransfer = init.dataTransfer || null
    }
  }
  window.DragEvent = DragEventMock
  global.DragEvent = DragEventMock
}

// jsdom's Blob/File do not implement text()
if (typeof Blob !== 'undefined' && !Blob.prototype.text) {
  Blob.prototype.text = function text() {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(reader.error)
      reader.readAsText(this)
    })
  }
}
