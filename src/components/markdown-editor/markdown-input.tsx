"use client"

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  addToDictionary,
  checkGrammar,
  debounce,
  GrammarError,
  isInsideCodeBlock,
  stripMarkdownForGrammarCheck,
} from "@/lib/grammar-check"
import { cn } from "@/lib/utils"

import { GrammarContextMenu, GrammarTooltip } from "./grammar-tooltip"

export interface MarkdownInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
  grammarCheckEnabled?: boolean
  grammarCheckLanguage?: string
  grammarCheckDebounceTime?: number
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
  // Add a state to track scroll position for re-rendering
  const [scrollPosition, setScrollPosition] = useState({ top: 0, left: 0 })

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
      const newValue = value.substring(0, start) + emojiCode + value.substring(end)
      
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

  // Sync overlay scroll with textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    const handleScroll = () => {
      setScrollPosition({
        top: textarea.scrollTop,
        left: textarea.scrollLeft,
      })
    }
    textarea.addEventListener("scroll", handleScroll)
    return () => textarea.removeEventListener("scroll", handleScroll)
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
  const performGrammarCheck = async (text: string) => {
    if (!grammarCheckEnabled || !text.trim()) {
      setGrammarErrors([])
      setIsGrammarCheckLoading(false)
      return
    }

    try {
      const errors = await checkGrammar(text, mapping, {
        language: grammarCheckLanguage,
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
  }

  // Process text for grammar checking
  // Use a ref to store the timeout ID
  const grammarCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!grammarCheckEnabled) {
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
    grammarCheckDebounceTime,
    grammarCheckLanguage,
    mapping,
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
    <div className={cn("relative w-full", className)} ref={editorRef}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full w-full resize-none rounded-md border border-solid border-[hsl(var(--markdown-input-border))] bg-gradient-to-br from-[hsl(var(--editor-gradient-start))] to-[hsl(var(--editor-gradient-end))] px-6 py-4 font-mono text-sm leading-relaxed tracking-wide text-[hsl(var(--markdown-input-text))] shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-50"
        placeholder="Write your markdown here..."
        aria-label="Markdown editor"
        spellCheck="false"
        data-testid="markdown-input"
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

      {/* Loading indicator for grammar checking */}
      {isGrammarCheckLoading && (
        <div className="absolute bottom-2 right-2 flex items-center text-xs text-muted-foreground">
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
