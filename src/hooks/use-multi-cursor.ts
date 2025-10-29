import { useCallback, useEffect, useState, RefObject } from "react"
import {
  addCursor,
  applyBackspace,
  applyTextChange,
  clearSecondaryCursors,
  Cursor,
  getCursorPositions,
  initializeMultiCursor,
  MultiCursorState,
  selectNextOccurrence,
} from "@/lib/multi-cursor"

export interface UseMultiCursorOptions {
  textareaRef: RefObject<HTMLTextAreaElement>
  mirrorDivRef: RefObject<HTMLDivElement>
  value: string
  onChange: (value: string) => void
  enabled?: boolean
}

export function useMultiCursor({
  textareaRef,
  mirrorDivRef,
  value,
  onChange,
  enabled = true,
}: UseMultiCursorOptions) {
  const [multiCursorState, setMultiCursorState] = useState<MultiCursorState>(
    () => initializeMultiCursor(0, 0)
  )
  const [isMultiCursorActive, setIsMultiCursorActive] = useState(false)

  // Sync primary cursor with textarea selection
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea || !enabled) return

    const handleSelectionChange = () => {
      if (!isMultiCursorActive) {
        setMultiCursorState(
          initializeMultiCursor(textarea.selectionStart, textarea.selectionEnd)
        )
      }
    }

    textarea.addEventListener("select", handleSelectionChange)
    textarea.addEventListener("click", handleSelectionChange)

    return () => {
      textarea.removeEventListener("select", handleSelectionChange)
      textarea.removeEventListener("click", handleSelectionChange)
    }
  }, [textareaRef, enabled, isMultiCursorActive])

  // Handle Alt+Click to add cursors
  const handleClick = useCallback(
    (event: MouseEvent) => {
      const textarea = textareaRef.current
      if (!enabled || !textarea || !event.altKey) return

      event.preventDefault()

      // Calculate cursor position from click
      const rect = textarea.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Get scroll offsets
      const scrollLeft = textarea.scrollLeft
      const scrollTop = textarea.scrollTop

      // Approximate cursor position
      const style = window.getComputedStyle(textarea)
      const lineHeight = parseInt(style.lineHeight || "20", 10)
      const charWidth = 8 // Approximate monospace character width
      const padding = 24 // textarea padding

      const lineNumber = Math.floor((y + scrollTop - padding) / lineHeight)
      const columnNumber = Math.floor((x + scrollLeft - padding) / charWidth)

      // Find the actual position in the text
      const lines = value.split("\n")
      let position = 0

      for (let i = 0; i < lineNumber && i < lines.length; i++) {
        position += lines[i].length + 1 // +1 for newline
      }

      if (lineNumber < lines.length) {
        position += Math.min(columnNumber, lines[lineNumber]?.length || 0)
      }

      // Add cursor at this position
      setMultiCursorState((prev) => addCursor(prev, position, position))
      setIsMultiCursorActive(true)
    },
    [enabled, textareaRef, value]
  )

  // Handle Ctrl+D to select next occurrence
  const handleSelectNext = useCallback(() => {
    if (!enabled) return

    const primaryCursor = multiCursorState.cursors.find(
      (c) => c.id === multiCursorState.primaryCursorId
    )

    const textarea = textareaRef.current
    if (!primaryCursor || primaryCursor.start === primaryCursor.end) {
      // No selection, select word at cursor
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd

        if (start === end) {
          // Find word boundaries
          const text = textarea.value
          let wordStart = start
          let wordEnd = start

          // Move back to word start
          while (wordStart > 0 && /\w/.test(text[wordStart - 1])) {
            wordStart--
          }

          // Move forward to word end
          while (wordEnd < text.length && /\w/.test(text[wordEnd])) {
            wordEnd++
          }

          if (wordStart < wordEnd) {
            setMultiCursorState(initializeMultiCursor(wordStart, wordEnd))
            setIsMultiCursorActive(true)
            textarea.setSelectionRange(wordStart, wordEnd)
            return
          }
        }
      }
    }

    setMultiCursorState((prev) => selectNextOccurrence(prev, value))
    setIsMultiCursorActive(true)
  }, [enabled, multiCursorState, value, textareaRef])

  // Handle text input across multiple cursors
  const handleInput = useCallback(
    (insertText: string) => {
      if (!enabled || !isMultiCursorActive) return false

      const { newText, newState } = applyTextChange(
        multiCursorState,
        value,
        insertText
      )

      onChange(newText)
      setMultiCursorState(newState)

      return true
    },
    [enabled, isMultiCursorActive, multiCursorState, value, onChange]
  )

  // Handle backspace across multiple cursors
  const handleBackspaceKey = useCallback(() => {
    if (!enabled || !isMultiCursorActive) return false

    const { newText, newState } = applyBackspace(multiCursorState, value)

    onChange(newText)
    setMultiCursorState(newState)

    return true
  }, [enabled, isMultiCursorActive, multiCursorState, value, onChange])

  // Clear multi-cursor mode on Escape
  const handleEscape = useCallback(() => {
    if (isMultiCursorActive) {
      setIsMultiCursorActive(false)
      setMultiCursorState((prev) => clearSecondaryCursors(prev))
      return true
    }
    return false
  }, [isMultiCursorActive])

  // Get cursor positions for rendering (exclude primary cursor)
  // Recalculate on every render when multi-cursor is active
  const secondaryCursors = multiCursorState.cursors.filter(
    (c) => c.id !== multiCursorState.primaryCursorId
  )

  const cursorPositions = (() => {
    if (!textareaRef.current || !isMultiCursorActive || secondaryCursors.length === 0) {
      return []
    }

    return getCursorPositions(textareaRef.current, secondaryCursors, mirrorDivRef.current)
  })()

  return {
    multiCursorState,
    isMultiCursorActive,
    cursorPositions,
    handleClick,
    handleSelectNext,
    handleInput,
    handleBackspaceKey,
    handleEscape,
  }
}
