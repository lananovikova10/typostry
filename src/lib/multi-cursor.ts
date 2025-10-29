/**
 * Multi-cursor support utilities for the markdown editor
 */

export interface Cursor {
  id: string
  start: number
  end: number
}

export interface MultiCursorState {
  cursors: Cursor[]
  primaryCursorId: string
}

/**
 * Creates a new cursor
 */
export function createCursor(start: number, end: number = start): Cursor {
  return {
    id: Math.random().toString(36).substring(7),
    start,
    end,
  }
}

/**
 * Initializes multi-cursor state with a primary cursor
 */
export function initializeMultiCursor(start: number, end: number = start): MultiCursorState {
  const cursor = createCursor(start, end)
  return {
    cursors: [cursor],
    primaryCursorId: cursor.id,
  }
}

/**
 * Adds a new cursor at the specified position
 */
export function addCursor(
  state: MultiCursorState,
  start: number,
  end: number = start
): MultiCursorState {
  // Check if cursor already exists at this position
  const exists = state.cursors.some(
    (c) => c.start === start && c.end === end
  )

  if (exists) {
    return state
  }

  const newCursor = createCursor(start, end)

  // Sort cursors by position for easier processing
  const cursors = [...state.cursors, newCursor].sort((a, b) => a.start - b.start)

  return {
    ...state,
    cursors,
  }
}

/**
 * Removes a cursor by ID
 */
export function removeCursor(
  state: MultiCursorState,
  cursorId: string
): MultiCursorState {
  // Don't remove if it's the last cursor
  if (state.cursors.length === 1) {
    return state
  }

  const cursors = state.cursors.filter((c) => c.id !== cursorId)

  // If we removed the primary cursor, make the first one primary
  const primaryCursorId = cursorId === state.primaryCursorId
    ? cursors[0].id
    : state.primaryCursorId

  return {
    cursors,
    primaryCursorId,
  }
}

/**
 * Clears all cursors except the primary one
 */
export function clearSecondaryCursors(state: MultiCursorState): MultiCursorState {
  const primaryCursor = state.cursors.find((c) => c.id === state.primaryCursorId)

  if (!primaryCursor) {
    return state
  }

  return {
    cursors: [primaryCursor],
    primaryCursorId: primaryCursor.id,
  }
}

/**
 * Finds the next occurrence of selected text and adds a cursor there
 */
export function selectNextOccurrence(
  state: MultiCursorState,
  text: string
): MultiCursorState {
  // Get the primary cursor
  const primaryCursor = state.cursors.find((c) => c.id === state.primaryCursorId)

  if (!primaryCursor) {
    return state
  }

  // Get the selected text at the primary cursor
  const selectedText = text.substring(primaryCursor.start, primaryCursor.end)

  if (!selectedText) {
    return state
  }

  // Find the next occurrence after the last cursor
  const lastCursor = state.cursors[state.cursors.length - 1]
  const searchStart = lastCursor.end
  const nextIndex = text.indexOf(selectedText, searchStart)

  if (nextIndex === -1) {
    // No more occurrences found, wrap to beginning
    const wrappedIndex = text.indexOf(selectedText, 0)

    if (wrappedIndex === -1 || wrappedIndex === primaryCursor.start) {
      return state
    }

    return addCursor(state, wrappedIndex, wrappedIndex + selectedText.length)
  }

  return addCursor(state, nextIndex, nextIndex + selectedText.length)
}

/**
 * Applies text insertion/deletion to all cursors
 */
export function applyTextChange(
  state: MultiCursorState,
  text: string,
  insertText: string
): { newText: string; newState: MultiCursorState } {
  // Process cursors in reverse order to maintain correct positions
  let newText = text
  let offset = 0
  const newCursors: Cursor[] = []

  // Sort cursors by position (should already be sorted, but just to be safe)
  const sortedCursors = [...state.cursors].sort((a, b) => a.start - b.start)

  for (let i = sortedCursors.length - 1; i >= 0; i--) {
    const cursor = sortedCursors[i]
    const start = cursor.start
    const end = cursor.end
    const selectionLength = end - start

    // Replace text at cursor position
    newText =
      newText.substring(0, start) +
      insertText +
      newText.substring(end)

    // Calculate new cursor position
    const newCursorPos = start + insertText.length

    // Create updated cursor
    newCursors.unshift({
      ...cursor,
      start: newCursorPos,
      end: newCursorPos,
    })
  }

  // Adjust positions of all cursors after modifications
  const adjustedCursors: Cursor[] = []
  let cumulativeOffset = 0

  for (let i = 0; i < newCursors.length; i++) {
    const cursor = newCursors[i]
    const prevCursor = sortedCursors[i]
    const selectionLength = prevCursor.end - prevCursor.start
    const lengthDiff = insertText.length - selectionLength

    adjustedCursors.push({
      ...cursor,
      start: cursor.start + cumulativeOffset,
      end: cursor.end + cumulativeOffset,
    })

    cumulativeOffset += lengthDiff
  }

  return {
    newText,
    newState: {
      ...state,
      cursors: adjustedCursors,
    },
  }
}

/**
 * Handles backspace across multiple cursors
 */
export function applyBackspace(
  state: MultiCursorState,
  text: string
): { newText: string; newState: MultiCursorState } {
  let newText = text
  const newCursors: Cursor[] = []

  // Process cursors in reverse order
  const sortedCursors = [...state.cursors].sort((a, b) => b.start - a.start)

  for (const cursor of sortedCursors) {
    if (cursor.start !== cursor.end) {
      // Delete selection
      newText = newText.substring(0, cursor.start) + newText.substring(cursor.end)
      newCursors.unshift({
        ...cursor,
        start: cursor.start,
        end: cursor.start,
      })
    } else if (cursor.start > 0) {
      // Delete one character before cursor
      newText = newText.substring(0, cursor.start - 1) + newText.substring(cursor.start)
      newCursors.unshift({
        ...cursor,
        start: cursor.start - 1,
        end: cursor.start - 1,
      })
    } else {
      // At start of document, can't delete
      newCursors.unshift(cursor)
    }
  }

  // Recalculate positions accounting for deletions
  let offset = 0
  const adjustedCursors: Cursor[] = []

  for (let i = 0; i < newCursors.length; i++) {
    const cursor = newCursors[i]
    const originalCursor = sortedCursors[sortedCursors.length - 1 - i]
    const deletedLength = originalCursor.end - originalCursor.start || 1

    adjustedCursors.push({
      ...cursor,
      start: cursor.start - offset,
      end: cursor.end - offset,
    })

    if (cursor.start < originalCursor.start) {
      offset += deletedLength
    }
  }

  return {
    newText,
    newState: {
      ...state,
      cursors: adjustedCursors.sort((a, b) => a.start - b.start),
    },
  }
}

/**
 * Gets pixel positions for rendering cursor overlays using mirror div technique
 */
export function getCursorPositions(
  textarea: HTMLTextAreaElement,
  cursors: Cursor[],
  mirrorDiv?: HTMLDivElement | null
): Array<{ top: number; left: number; height: number }> {
  if (!mirrorDiv) {
    // Fallback to line-based calculation
    const style = window.getComputedStyle(textarea)
    const lineHeight = parseInt(style.lineHeight || '20', 10)

    return cursors.map((cursor) => {
      const { start } = cursor
      const text = textarea.value.substring(0, start)
      const lines = text.split('\n')
      const lineNumber = lines.length - 1
      const columnNumber = lines[lines.length - 1].length

      const top = lineNumber * lineHeight + 4
      const left = columnNumber * 8 + 6

      return {
        top,
        left,
        height: lineHeight,
      }
    })
  }

  // Use mirror div for accurate position calculation (same technique as grammar errors)
  const value = textarea.value

  return cursors.map((cursor) => {
    const { start } = cursor

    // Set mirror content up to cursor position using innerText (preserves line breaks)
    const before = value.slice(0, start)
    mirrorDiv.innerText = before

    // Create a span at cursor position to measure
    const cursorSpan = document.createElement('span')
    cursorSpan.innerText = '|'
    cursorSpan.style.display = 'inline-block'
    cursorSpan.style.verticalAlign = 'baseline'
    mirrorDiv.appendChild(cursorSpan)

    // Get bounding rects (relative to mirror div)
    const spanRect = cursorSpan.getBoundingClientRect()
    const mirrorRect = mirrorDiv.getBoundingClientRect()

    // Clean up
    mirrorDiv.removeChild(cursorSpan)

    const position = {
      left: spanRect.left - mirrorRect.left,
      top: spanRect.top - mirrorRect.top,
      height: spanRect.height || 20,
    }

    console.log(`Cursor at offset ${start}:`, {
      before: before.substring(before.length - 20), // Last 20 chars
      position,
      spanRect: { left: spanRect.left, top: spanRect.top },
      mirrorRect: { left: mirrorRect.left, top: mirrorRect.top },
    })

    // Return relative positions (just like grammar errors)
    return position
  })
}
