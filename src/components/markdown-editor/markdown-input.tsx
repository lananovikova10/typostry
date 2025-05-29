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
  debounce,
  GrammarError,
  isInsideCodeBlock,
  stripMarkdownForGrammarCheck,
  grammarServiceManager,
  GrammarServiceProvider,
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

  // Sync overlay scroll with textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    let scrollTimeout: NodeJS.Timeout
    const handleScroll = () => {
      // Clear previous timeout to debounce scroll updates
      clearTimeout(scrollTimeout)
      
      // Update scroll position immediately for smooth scrolling
      setScrollPosition({
        top: textarea.scrollTop,
        left: textarea.scrollLeft,
      })
      
      // Force a re-render of grammar errors after scroll settles
      scrollTimeout = setTimeout(() => {
        setScrollPosition(prev => ({
          top: textarea.scrollTop,
          left: textarea.scrollLeft,
        }))
      }, 16) // ~60fps
    }
    
    textarea.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      textarea.removeEventListener("scroll", handleScroll)
      clearTimeout(scrollTimeout)
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

    // Define performGrammarCheck inside the useEffect to avoid dependency issues
    const performGrammarCheck = async (text: string) => {
      if (!grammarCheckEnabled || !text.trim()) {
        setGrammarErrors([])
        setIsGrammarCheckLoading(false)
        return
      }

      setIsGrammarCheckLoading(true)

      try {
        if (process.env.NODE_ENV === 'development') {
          console.log("Starting grammar check for text:", text.length, "characters")
        }
        
        // Validate mapping object
        if (!mapping || typeof mapping !== 'object') {
          console.warn("Invalid mapping object for grammar check")
          setGrammarErrors([])
          setIsGrammarCheckLoading(false)
          return
        }

        const errors = await grammarServiceManager.checkGrammar(text, mapping, {
          language: grammarCheckLanguage,
        })

        if (process.env.NODE_ENV === 'development') {
          console.log("Grammar check completed, found", errors?.length || 0, "errors")
        }

        // Validate errors array
        if (!Array.isArray(errors)) {
          console.warn("Grammar service returned non-array result:", typeof errors)
          setGrammarErrors([])
          setIsGrammarCheckLoading(false)
          return
        }

        // Filter out errors in code blocks
        const filteredErrors = errors.filter(
          (error) => !isInsideCodeBlock(error.originalOffset, value)
        )

        setGrammarErrors(filteredErrors)
      } catch (error) {
        console.error("Grammar check failed:", error)
        
        // More specific error handling
        if (error instanceof Error) {
          console.error("Error message:", error.message)
          
          // Handle specific Grazie API errors
          if (error.message.includes("problems")) {
            console.error("Grazie API response structure error - this usually means the API returned unexpected data")
          } else if (error.message.includes("not configured")) {
            console.warn("Grammar service not properly configured")
          } else if (error.message.includes("network") || error.message.includes("fetch")) {
            console.warn("Network error during grammar check")
          }
        }
        
        // Always reset to empty array on error to prevent UI issues
        setGrammarErrors([])
      } finally {
        setIsGrammarCheckLoading(false)
      }
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

  // Helper: get error position using textarea's native selection measurement
  const getErrorPosition = (offset: number, length: number) => {
    const textarea = textareaRef.current
    if (!textarea) return { left: 0, top: 0, width: 0 }

    // Validate input parameters
    if (typeof offset !== 'number' || typeof length !== 'number' || offset < 0 || length <= 0) {
      console.warn('Invalid offset or length for error position:', { offset, length })
      return { left: 0, top: 0, width: 0 }
    }

    // Save current selection state
    const originalStart = textarea.selectionStart
    const originalEnd = textarea.selectionEnd
    const originalFocus = document.activeElement === textarea

    try {
      // Ensure offset doesn't exceed text length and is valid
      if (offset >= value.length) {
        console.warn('Offset exceeds text length:', { offset, textLength: value.length })
        return { left: 0, top: 0, width: 0 }
      }

      const maxOffset = Math.min(offset, value.length - 1)
      const maxLength = Math.min(length, value.length - maxOffset)
      
      if (maxLength <= 0) {
        console.warn('Computed length is zero or negative:', { offset, length, maxOffset, maxLength })
        return { left: 0, top: 0, width: 0 }
      }

      try {
        // Set selection to the error position
        textarea.setSelectionRange(maxOffset, maxOffset + maxLength)
      } catch (selectionError) {
        console.warn('Error setting selection range:', selectionError, { maxOffset, maxLength })
        return { left: 0, top: 0, width: 0 }
      }
      
      // Force focus temporarily to ensure selection is visible
      if (!originalFocus) {
        textarea.focus()
      }

      // Get textarea's bounding rect for reference
      const textareaRect = textarea.getBoundingClientRect()
      
      // Get computed styles for padding calculation
      const styles = window.getComputedStyle(textarea)
      const paddingLeft = parseFloat(styles.paddingLeft) || 0
      const paddingTop = parseFloat(styles.paddingTop) || 0
      const borderLeft = parseFloat(styles.borderLeftWidth) || 0
      const borderTop = parseFloat(styles.borderTopWidth) || 0
      
      // Calculate content area offset
      const contentOffsetX = paddingLeft + borderLeft
      const contentOffsetY = paddingTop + borderTop
      
      // Use a temporary canvas to measure text up to the error position
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.warn('Canvas context not available, using fallback positioning')
        return { left: 0, top: 0, width: Math.max(maxLength * 8, 8) }
      }
      
      // Set canvas font to match textarea
      const fontSize = styles.fontSize
      const fontFamily = styles.fontFamily
      ctx.font = `${fontSize} ${fontFamily}`
      
      // Split text into lines to find the correct line
      const lines = value.slice(0, maxOffset).split('\n')
      const currentLineIndex = lines.length - 1
      const currentLineText = lines[currentLineIndex] || ''
      
      // Ensure we're not trying to slice beyond text bounds
      const errorEndOffset = Math.min(maxOffset + maxLength, value.length)
      const errorText = value.slice(maxOffset, errorEndOffset) || ' '
      
      // Calculate line height
      const lineHeight = parseFloat(styles.lineHeight) || parseFloat(fontSize) * 1.2
      
      // Measure text width up to error position in current line
      const textWidth = ctx.measureText(currentLineText).width
      const errorWidth = Math.max(ctx.measureText(errorText).width, 8) // Minimum 8px width
      
      // Calculate position
      const left = textWidth
      const top = currentLineIndex * lineHeight + lineHeight - 2 // Position at baseline
      
      return {
        left: Math.max(0, left),
        top: Math.max(0, top),
        width: Math.max(8, errorWidth),
        height: 2, // Fixed height for underline
      }
    } catch (error) {
      console.error('Error calculating position:', error)
      return { left: 0, top: 0, width: 8 }
    } finally {
      try {
        // Restore original selection state
        if (originalFocus) {
          textarea.setSelectionRange(originalStart || 0, originalEnd || 0)
        } else {
          textarea.blur()
          textarea.setSelectionRange(originalStart || 0, originalEnd || 0)
        }
      } catch (restoreError) {
        console.warn('Error restoring selection state:', restoreError)
      }
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
  // Render grammar error highlights
  const renderGrammarErrors = () => {
    if (!grammarCheckEnabled || !grammarErrors.length) {
      return null
    }

    // Debug log is kept for development but doesn't output sensitive data
    if (process.env.NODE_ENV === 'development') {
      console.log("Rendering grammar errors:", grammarErrors.length, "scroll:", scrollPosition)
    }

    return grammarErrors.map((error, index) => {
      // Skip invalid errors or those with invalid offsets/lengths
      if (error.originalOffset === undefined || 
          error.originalLength === undefined || 
          error.originalOffset < 0 || 
          error.originalLength <= 0 ||
          error.originalOffset >= value.length) {
        return null
      }
      
      try {
        const { left, top, width, height } = getErrorPosition(
          error.originalOffset,
          error.originalLength
        )
        
        // Validate position values
        if (typeof left !== 'number' || typeof top !== 'number' || 
            isNaN(left) || isNaN(top) || width <= 0) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Invalid position for error ${index}:`, { left, top, width, height })
          }
          return null
        }
        
        // Direct positioning - no scroll adjustment needed with canvas measurement
        const finalLeft = left
        const finalTop = top
        
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
                left: `${finalLeft}px`,
                top: `${finalTop}px`,
                width: `${width}px`,
                height: `${height || 2}px`, // Ensure at least 2px height
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
      } catch (positionError) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`Error rendering grammar error ${index}:`, positionError)
        }
        return null
      }
    }).filter(Boolean) // Remove null entries
  }

  return (
    <div className={cn("relative w-full", className)} ref={editorRef}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-auto w-full resize-none rounded-md border border-solid border-[hsl(var(--markdown-input-border))] bg-gradient-to-br from-[hsl(var(--editor-gradient-start))] to-[hsl(var(--editor-gradient-end))] px-6 py-4 font-mono text-sm leading-relaxed tracking-wide text-[hsl(var(--markdown-input-text))] shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-50"
        placeholder="Write your markdown here..."
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
          width: "100%",
          height: "auto",
          top: 0,
          left: 0,
          background: "none",
          boxSizing: "border-box",
          letterSpacing: "inherit",
          boxShadow: "none",
          margin: 0,
          tabSize: 2,
          border: "1px solid transparent", // Match textarea border for exact positioning
        }}
      />

      {/* Overlay for grammar error highlighting */}
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0"
        style={{
          overflow: "hidden",
          pointerEvents: "none",
          top: "1rem",
          left: "1.5rem",
          right: "1.5rem", 
          bottom: "1rem",
          fontFamily: "monospace",
          fontSize: "inherit",
          lineHeight: "1.5rem",
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
