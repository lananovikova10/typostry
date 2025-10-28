"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface UseDebouncedPreviewOptions {
  /** Debounce delay in milliseconds (default: 200ms) */
  debounceMs?: number
  /** Minimum change threshold to trigger update (default: 1 character) */
  minChangeThreshold?: number
  /** Enable immediate local echo for better perceived performance */
  enableLocalEcho?: boolean
}

/**
 * Custom hook for intelligent debouncing of preview updates
 *
 * Features:
 * - Configurable debounce delay (150-300ms recommended)
 * - Immediate local echo for better perceived performance
 * - Smart batching of rapid changes
 * - Cancellation of pending updates
 *
 * @returns Debounced value and processing state
 */
export function useDebouncedPreview(
  value: string,
  options: UseDebouncedPreviewOptions = {}
) {
  const {
    debounceMs = 200,
    minChangeThreshold = 1,
    enableLocalEcho = true,
  } = options

  const [debouncedValue, setDebouncedValue] = useState(value)
  const [isDebouncing, setIsDebouncing] = useState(false)
  const [localEchoValue, setLocalEchoValue] = useState(value)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousValueRef = useRef(value)
  const updateCountRef = useRef(0)

  useEffect(() => {
    // Track if value actually changed
    const hasChanged = value !== previousValueRef.current
    if (!hasChanged) return

    // Calculate change magnitude
    const changeSize = Math.abs(value.length - previousValueRef.current.length)

    // Update local echo immediately for better perceived performance
    if (enableLocalEcho) {
      setLocalEchoValue(value)
    }

    // Skip debouncing for small changes below threshold
    if (changeSize < minChangeThreshold && updateCountRef.current > 0) {
      previousValueRef.current = value
      return
    }

    // Set debouncing state
    setIsDebouncing(true)

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Adaptive debounce delay based on change frequency
    updateCountRef.current++
    const adaptiveDelay = updateCountRef.current > 10
      ? Math.min(debounceMs * 1.5, 500) // Increase delay for rapid changes
      : debounceMs

    // Set new timeout for debounced update
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
      setIsDebouncing(false)
      previousValueRef.current = value
      updateCountRef.current = 0 // Reset counter after successful update
    }, adaptiveDelay)

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, debounceMs, minChangeThreshold, enableLocalEcho])

  // Reset counter after period of inactivity
  useEffect(() => {
    const resetTimeout = setTimeout(() => {
      updateCountRef.current = 0
    }, 2000)

    return () => clearTimeout(resetTimeout)
  }, [value])

  /**
   * Cancel any pending debounced update
   */
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
      setIsDebouncing(false)
      updateCountRef.current = 0
    }
  }, [])

  /**
   * Flush pending update immediately
   */
  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setDebouncedValue(value)
    setIsDebouncing(false)
    previousValueRef.current = value
    updateCountRef.current = 0
  }, [value])

  return {
    /** The debounced value to use for expensive operations */
    debouncedValue,
    /** Whether a debounced update is pending */
    isDebouncing,
    /** Immediate local echo value for instant feedback */
    localEchoValue: enableLocalEcho ? localEchoValue : debouncedValue,
    /** Cancel any pending update */
    cancel,
    /** Flush pending update immediately */
    flush,
  }
}
