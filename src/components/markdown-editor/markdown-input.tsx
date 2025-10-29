"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  addToDictionary,
  checkGrammar,
  checkGrammarManual,
  clearGrammarCache,
  debounce,
  GrammarError,
  isInsideCodeBlock,
  stripMarkdownForGrammarCheck,
} from "@/lib/grammar-check"
import { cn } from "@/lib/utils"

import { GrammarContextMenu, GrammarTooltip } from "./grammar-tooltip"
import { MarkdownAutocomplete, AutocompleteItem } from "./markdown-autocomplete"

export interface MarkdownInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
  grammarCheckEnabled?: boolean
  grammarCheckLanguage?: string
  grammarCheckDebounceTime?: number
  showGrammarButton?: boolean
  autoGrammarCheck?: boolean
}

export interface MarkdownInputHandle {
  getTextarea: () => HTMLTextAreaElement | null
  focus: () => void
  handleEmojiSelect: (emoji: any) => void
}

export const MarkdownInput = forwardRef<
  MarkdownInputHandle,
  MarkdownInputProps
>(function MarkdownInput(
  {
    value,
    onChange,
    className,
    grammarCheckEnabled = true,
    grammarCheckLanguage = "en-US",
    grammarCheckDebounceTime = 3000, // Increased to 3 seconds to reduce API call frequency
    showGrammarButton = true,
    autoGrammarCheck = false, // Default to manual checking to avoid rate limiting
  },
  ref
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const mirrorDivRef = useRef<HTMLDivElement>(null)
  const [grammarErrors, setGrammarErrors] = useState<GrammarError[]>([])
  const [hoveredError, setHoveredError] = useState<GrammarError | null>(null)
  const [isGrammarCheckLoading, setIsGrammarCheckLoading] = useState(false)
  const [truncationNotification, setTruncationNotification] = useState<{
    originalLength: number
    truncatedLength: number
  } | null>(null)
  // Add a state to track scroll position for re-rendering
  const [scrollPosition, setScrollPosition] = useState({ top: 0, left: 0 })
  // Add state for drag-and-drop visual feedback
  const [isDragOver, setIsDragOver] = useState(false)
  // Add state for cursor position to track autocomplete
  const [cursorPosition, setCursorPosition] = useState(0)

  // Store the last processed text to avoid unnecessary processing
  const lastProcessedText = useRef<string>("")

  useImperativeHandle(ref, () => ({
    getTextarea: () => textareaRef.current,
    focus: () => textareaRef.current?.focus(),
    handleEmojiSelect,
  }))

  // Function to handle emoji selection from the emoji picker
  const handleEmojiSelect = (emoji: any) => {
    // Get the current textarea element
    const textarea = textareaRef.current
    if (!textarea) return

    // Get current cursor position
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    // Process emoji to get shortcode
    let shortcode: string | null = null

    if (emoji.shortcodes && emoji.shortcodes.length > 0) {
      // Format: { shortcodes: ['smile', 'smiley'] }
      shortcode = emoji.shortcodes[0]
    } else if (emoji.id) {
      // Format: { id: 'smile', ... }
      shortcode = emoji.id
    } else if (emoji.name) {
      // Format: { name: 'Smiling Face', ... }
      // Convert name to shortcode format (lowercase, underscores for spaces)
      shortcode = emoji.name.toLowerCase().replace(/\s+/g, "_")
    }

    if (shortcode) {
      const emojiCode = `:${shortcode}:`

      // Create new value with emoji inserted at cursor position
      const newValue =
        value.substring(0, start) + emojiCode + value.substring(end)

      // Update content via onChange prop
      onChange(newValue)

      // Calculate new cursor position after the inserted emoji
      const newCursorPosition = start + emojiCode.length

      // Restore focus to the textarea and set cursor position
      requestAnimationFrame(() => {
        if (textarea) {
          textarea.focus()
          textarea.setSelectionRange(newCursorPosition, newCursorPosition)
        }
      })
    }
  }

  // Sync overlay scroll with textarea and track cursor position
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handleScroll = () => {
      setScrollPosition({
        top: textarea.scrollTop,
        left: textarea.scrollLeft,
      })
    }

    const handleSelectionChange = () => {
      setCursorPosition(textarea.selectionStart)
    }

    textarea.addEventListener("scroll", handleScroll)
    textarea.addEventListener("keyup", handleSelectionChange)
    textarea.addEventListener("click", handleSelectionChange)

    return () => {
      textarea.removeEventListener("scroll", handleScroll)
      textarea.removeEventListener("keyup", handleSelectionChange)
      textarea.removeEventListener("click", handleSelectionChange)
    }
  }, [])

  // Memoize the stripped text and mapping for performance
  const { stripped, mapping } = useMemo(() => {
    if (!grammarCheckEnabled || value === lastProcessedText.current) {
      return {
        stripped: "",
        mapping: {
          originalToStripped: new Map(),
          strippedToOriginal: new Map(),
        },
      }
    }
    return stripMarkdownForGrammarCheck(value)
  }, [value, grammarCheckEnabled])

  // Function to perform grammar check
  const performGrammarCheck = useCallback(async (text: string, isManual = false) => {
    if (!grammarCheckEnabled || !text.trim()) {
      setGrammarErrors([])
      setIsGrammarCheckLoading(false)
      return
    }

    try {
      const checkFunction = isManual ? checkGrammarManual : checkGrammar
      const errors = await checkFunction(text, mapping, {
        language: grammarCheckLanguage,
        onTextTruncated: (originalLength, truncatedLength) => {
          setTruncationNotification({ originalLength, truncatedLength })
          // Hide notification after 5 seconds
          setTimeout(() => setTruncationNotification(null), 5000)
        },
      })

      // Filter out errors in code blocks
      const filteredErrors = errors.filter(
        (error) => !isInsideCodeBlock(error.originalOffset, value)
      )

      setGrammarErrors(filteredErrors)
      console.log("Grammar errors found:", filteredErrors.length)
    } catch (error) {
      console.error("Grammar check failed:", error)
      setGrammarErrors([])
    } finally {
      setIsGrammarCheckLoading(false)
    }
  }, [grammarCheckEnabled, mapping, grammarCheckLanguage, value])

  // Manual grammar check function
  const handleManualGrammarCheck = async () => {
    if (!grammarCheckEnabled || !stripped.trim()) {
      return
    }

    setIsGrammarCheckLoading(true)
    lastProcessedText.current = value
    await performGrammarCheck(stripped, true)
  }

  // Process text for grammar checking
  // Use a ref to store the timeout ID
  const grammarCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!grammarCheckEnabled || !autoGrammarCheck) {
      return
    }

    // Clear any existing timeout
    if (grammarCheckTimeoutRef.current) {
      clearTimeout(grammarCheckTimeoutRef.current)
    }

    // Only set loading state if we're actually going to check
    if (value !== lastProcessedText.current && value.trim()) {
      setIsGrammarCheckLoading(true)
    }

    // Set a timeout to process the text after the user has stopped typing
    grammarCheckTimeoutRef.current = setTimeout(() => {
      if (value === lastProcessedText.current) {
        return
      }

      lastProcessedText.current = value
      performGrammarCheck(stripped)
    }, grammarCheckDebounceTime)

    // Cleanup function to clear the timeout when the component unmounts
    return () => {
      if (grammarCheckTimeoutRef.current) {
        clearTimeout(grammarCheckTimeoutRef.current)
      }
    }
  }, [
    value,
    stripped,
    grammarCheckEnabled,
    autoGrammarCheck,
    grammarCheckDebounceTime,
    grammarCheckLanguage,
    mapping,
    performGrammarCheck,
  ])

  // Helper: get error position in pixels using mirror div
  const getErrorPosition = (offset: number, length: number) => {
    const textarea = textareaRef.current
    const mirrorDiv = mirrorDivRef.current
    if (!textarea || !mirrorDiv) return { left: 0, top: 0, width: 0 }

    // Set mirror content up to error offset
    const before = value.slice(0, offset)
    const errorText = value.slice(offset, offset + length) || " "
    mirrorDiv.innerText = before
    // Create a span for the error text
    const errorSpan = document.createElement("span")
    errorSpan.innerText = errorText
    errorSpan.style.display = "inline-block"
    errorSpan.style.verticalAlign = "baseline"
    mirrorDiv.appendChild(errorSpan)

    // Get bounding rects
    const spanRect = errorSpan.getBoundingClientRect()
    const mirrorRect = mirrorDiv.getBoundingClientRect()
    mirrorDiv.removeChild(errorSpan)

    // Tweak: offsetY to align underline with text baseline
    const offsetY = 3 // px, tweak as needed for perfect alignment
    return {
      left: spanRect.left - mirrorRect.left,
      top: spanRect.top - mirrorRect.top + offsetY,
      width: spanRect.width,
      height: spanRect.height,
    }
  }

  // Handle applying a replacement suggestion
  const handleApplyReplacement = (error: GrammarError, replacement: string) => {
    if (!textareaRef.current) return

    // Save current scroll position
    const currentScrollTop = textareaRef.current.scrollTop
    const currentScrollLeft = textareaRef.current.scrollLeft

    // Apply the replacement in the textarea
    const start = error.originalOffset
    const end = error.originalOffset + error.originalLength

    const newValue =
      value.substring(0, start) + replacement + value.substring(end)

    onChange(newValue)

    // Focus the textarea and set cursor position after the replacement
    // while preserving scroll position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        const newPosition = start + replacement.length
        textareaRef.current.setSelectionRange(newPosition, newPosition)

        // Restore scroll position
        textareaRef.current.scrollTop = currentScrollTop
        textareaRef.current.scrollLeft = currentScrollLeft
      }
    }, 0)
  }

  // Handle adding a word to the custom dictionary
  const handleAddToDictionary = (error: GrammarError) => {
    // Save current scroll position if textarea exists
    const currentScrollTop = textareaRef.current?.scrollTop || 0
    const currentScrollLeft = textareaRef.current?.scrollLeft || 0

    const word = value.substring(
      error.originalOffset,
      error.originalOffset + error.originalLength
    )

    addToDictionary(word, error.rule?.id)

    // Remove the error from the current list
    setGrammarErrors((prev) =>
      prev.filter(
        (e) =>
          !(
            e.originalOffset === error.originalOffset &&
            e.originalLength === error.originalLength
          )
      )
    )

    // Restore scroll position after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.scrollTop = currentScrollTop
        textareaRef.current.scrollLeft = currentScrollLeft
      }
    }, 0)
  }

  // Handle autocomplete selection
  const handleAutocompleteSelect = (
    item: AutocompleteItem,
    replaceStart: number,
    replaceEnd: number
  ) => {
    if (!textareaRef.current) return

    // Save current scroll position
    const currentScrollTop = textareaRef.current.scrollTop
    const currentScrollLeft = textareaRef.current.scrollLeft

    // Replace text at the specified range
    let insertValue = item.value
    let newCursorPosition = replaceStart + insertValue.length

    // Special handling for certain syntax
    if (insertValue === "****") {
      // Bold - place cursor between asterisks
      newCursorPosition = replaceStart + 2
    } else if (insertValue === "**") {
      // Italic - place cursor between asterisks
      newCursorPosition = replaceStart + 1
    } else if (insertValue === "~~~~") {
      // Strikethrough - place cursor between tildes
      newCursorPosition = replaceStart + 2
    } else if (insertValue === "``") {
      // Code - place cursor between backticks
      newCursorPosition = replaceStart + 1
    } else if (insertValue === "[]()") {
      // Link - place cursor in brackets
      newCursorPosition = replaceStart + 1
    } else if (insertValue === "![]()") {
      // Image - place cursor in brackets
      newCursorPosition = replaceStart + 2
    } else if (insertValue.includes("\n")) {
      // Multi-line content like code blocks - place cursor appropriately
      const firstNewlineIndex = insertValue.indexOf("\n")
      newCursorPosition = replaceStart + firstNewlineIndex + 1
    }

    const newValue =
      value.substring(0, replaceStart) +
      insertValue +
      value.substring(replaceEnd)

    onChange(newValue)

    // Restore focus and cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
        textareaRef.current.scrollTop = currentScrollTop
        textareaRef.current.scrollLeft = currentScrollLeft
      }
    }, 0)
  }

  // Handle drag-and-drop events for local images
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("Drag enter", e.dataTransfer.types)
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("Drag over")
    if (e.dataTransfer.types.includes("Files")) {
      e.dataTransfer.dropEffect = "copy"
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set isDragOver to false if we're leaving the container
    const rect = editorRef.current?.getBoundingClientRect()
    if (rect) {
      const isOutside =
        e.clientX < rect.left ||
        e.clientX >= rect.right ||
        e.clientY < rect.top ||
        e.clientY >= rect.bottom
      if (isOutside) {
        setIsDragOver(false)
      }
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    console.log("Drop event", e.dataTransfer.files)
    const files = Array.from(e.dataTransfer.files)
    console.log("Files:", files)
    const imageFiles = files.filter((file) =>
      file.type.startsWith("image/")
    )
    console.log("Image files:", imageFiles)

    if (imageFiles.length === 0) {
      console.log("No image files found")
      return
    }

    const textarea = textareaRef.current
    if (!textarea) return

    // Save current scroll position
    const currentScrollTop = textarea.scrollTop
    const currentScrollLeft = textarea.scrollLeft

    // Get cursor position at drop location or use current cursor position
    const cursorPosition = textarea.selectionStart

    // Process each image file
    const imageMarkdowns: string[] = []
    for (const file of imageFiles) {
      try {
        // Upload image to server
        const imageUrl = await uploadImage(file)

        // Create markdown image syntax with the server URL
        const altText = file.name.replace(/\.[^/.]+$/, "") // Remove extension
        const markdown = `![${altText}](${imageUrl})`
        imageMarkdowns.push(markdown)
      } catch (error) {
        console.error("Error uploading image:", error)
      }
    }

    if (imageMarkdowns.length > 0) {
      // Join multiple images with newlines
      const imagesText = imageMarkdowns.join("\n\n")

      // Insert at cursor position
      const newValue =
        value.substring(0, cursorPosition) +
        "\n" +
        imagesText +
        "\n" +
        value.substring(cursorPosition)

      onChange(newValue)

      // Restore focus and cursor position
      setTimeout(() => {
        if (textarea) {
          textarea.focus()
          const newPosition = cursorPosition + imagesText.length + 2
          textarea.setSelectionRange(newPosition, newPosition)
          textarea.scrollTop = currentScrollTop
          textarea.scrollLeft = currentScrollLeft
        }
      }, 0)
    }
  }

  // Helper function to upload image to server
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to upload image")
    }

    const data = await response.json()
    return data.url
  }

  // Render grammar errors
  const renderGrammarErrors = () => {
    if (!grammarCheckEnabled || !grammarErrors.length) {
      return null
    }

    console.log("Rendering grammar errors:", grammarErrors.length)

    return grammarErrors.map((error, index) => {
      const { left, top, width, height } = getErrorPosition(
        error.originalOffset,
        error.originalLength
      )
      return (
        <GrammarContextMenu
          key={`grammar-error-${index}`}
          error={error}
          onApplyReplacement={(replacement) =>
            handleApplyReplacement(error, replacement)
          }
          onAddToDictionary={() => handleAddToDictionary(error)}
        >
          <div
            className={cn(
              "grammar-error pointer-events-auto absolute cursor-pointer",
              `grammar-error-${error.severity}`
            )}
            style={{
              left,
              top,
              width: width || 2,
              height: height || 20,
              zIndex: 10,
              backgroundColor: "transparent",
              borderBottom: "2px dotted",
              borderBottomColor:
                error.severity === "high"
                  ? "var(--grammar-error-underline-error)"
                  : error.severity === "medium"
                    ? "var(--grammar-error-underline-warning)"
                    : "var(--grammar-error-underline-info)",
              position: "absolute",
              pointerEvents: "auto",
            }}
            onMouseEnter={() => setHoveredError(error)}
            onMouseLeave={() => setHoveredError(null)}
            data-testid={`grammar-error-${index}`}
            aria-label={`${error.type} error (${error.severity} severity): ${error.message}`}
          />
        </GrammarContextMenu>
      )
    })
  }

  return (
    <div
      className={cn("relative w-full", className)}
      ref={editorRef}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "h-auto w-full resize-none rounded-md border border-solid bg-gradient-to-br px-6 py-4 font-mono text-sm leading-relaxed tracking-wide shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-50 transition-all",
          isDragOver
            ? "border-2 border-dashed border-primary bg-primary/5 ring-2 ring-primary ring-opacity-50"
            : "border-[hsl(var(--markdown-input-border))] from-[hsl(var(--editor-gradient-start))] to-[hsl(var(--editor-gradient-end))] text-[hsl(var(--markdown-input-text))]"
        )}
        placeholder="Write your markdown here... (or drag & drop images)"
        aria-label="Markdown editor"
        spellCheck="false"
        data-testid="markdown-input"
        rows={Math.max(3, value.split("\n").length)}
      />

      {/* Hidden mirror div for highlight calculations */}
      <div
        ref={mirrorDivRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          visibility: "hidden",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: -1,
          fontFamily: "monospace",
          fontSize: "inherit",
          lineHeight: "1.5rem",
          padding: "1rem 1.5rem",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          background: "none",
          border: "none",
          boxSizing: "border-box",
          letterSpacing: "inherit",
          boxShadow: "none",
          margin: 0,
        }}
      />

      {/* Overlay for grammar error highlighting */}
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0"
        style={{
          overflow: "hidden",
          pointerEvents: "none",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          fontFamily: "monospace",
          fontSize: "inherit",
          lineHeight: "1.5rem",
          padding: "1rem 1.5rem",
          // Sync overlay with textarea scroll
          transform: `translate(${-scrollPosition.left}px, ${-scrollPosition.top}px)`,
        }}
      >
        {renderGrammarErrors()}
      </div>

      {/* Tooltip for hovered grammar error */}
      {hoveredError && (
        <GrammarTooltip
          error={hoveredError}
          onApplyReplacement={(replacement) =>
            handleApplyReplacement(hoveredError, replacement)
          }
          onAddToDictionary={() => handleAddToDictionary(hoveredError)}
        />
      )}

      {/* Grammar check button */}
      {showGrammarButton && grammarCheckEnabled && !autoGrammarCheck && (
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={handleManualGrammarCheck}
            disabled={isGrammarCheckLoading || !stripped.trim()}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:text-gray-400 text-blue-700 rounded border border-blue-300 hover:border-blue-400 disabled:border-gray-300 transition-colors"
            title="Check grammar and spelling"
          >
            <svg
              className="h-3 w-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Check Grammar
          </button>
          <button
            onClick={() => {
              clearGrammarCache()
              setGrammarErrors([])
            }}
            className="flex items-center px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded border border-gray-300 hover:border-gray-400 transition-colors"
            title="Clear grammar cache and errors"
          >
            <svg
              className="h-3 w-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Text truncation notification */}
      {truncationNotification && (
        <div className="absolute top-2 left-2 right-2 z-20 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-md text-xs flex items-start gap-2">
          <svg
            className="h-4 w-4 mt-0.5 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 15.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div className="flex-1">
            <div className="font-medium">Text truncated for grammar check</div>
            <div className="text-yellow-700">
              Only the first {truncationNotification.truncatedLength.toLocaleString()} characters
              (of {truncationNotification.originalLength.toLocaleString()}) were checked due to API limits.
            </div>
          </div>
          <button
            onClick={() => setTruncationNotification(null)}
            className="text-yellow-600 hover:text-yellow-800 ml-2"
            title="Dismiss"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Loading indicator for grammar checking */}
      {isGrammarCheckLoading && (
        <div className="absolute -bottom-6 right-2 flex items-center text-xs text-muted-foreground">
          <svg
            className="mr-1 h-3 w-3 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Checking grammar...
        </div>
      )}

      {/* Autocomplete dropdown */}
      <MarkdownAutocomplete
        textarea={textareaRef.current}
        value={value}
        cursorPosition={cursorPosition}
        onSelect={handleAutocompleteSelect}
      />
    </div>
  )
})

// Add the following CSS to globals.css or a relevant CSS/SCSS file:
// :root {
//   --grammar-error-underline-error: #e53e3e;
//   --grammar-error-underline-warning: #dd6b20;
//   --grammar-error-underline-info: #3182ce;
// }
// .dark {
//   --grammar-error-underline-error: #ff8b8b;
//   --grammar-error-underline-warning: #f6ad55;
//   --grammar-error-underline-info: #90cdf4;
// }
