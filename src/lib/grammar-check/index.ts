/**
 * Grammar checking module for markdown editor
 */
export * from "./types"
export * from "./preprocessor"
export * from "./api"
export * from "./dictionary"
export * from "./service-interface"
export * from "./service-manager"
export * from "./languagetool-service"
export * from "./grazie-service"

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function (...args: Parameters<T>): void {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout !== null) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(later, wait)
  }
}
