"use client"

import { useState, useRef, forwardRef, useImperativeHandle, useEffect, useMemo } from "react"

import { cn } from "@/lib/utils"
import {
  stripMarkdownForGrammarCheck,
  checkGrammar,
  GrammarError,
  isInsideCodeBlock,
  debounce,
  addToDictionary,
} from "@/lib/grammar-check"
import { GrammarTooltip, GrammarContextMenu } from "./grammar-tooltip"

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
}

export const MarkdownInput = forwardRef<MarkdownInputHandle, MarkdownInputProps>(
  function MarkdownInput({
    value,
    onChange,
    className,
    grammarCheckEnabled = true,
    grammarCheckLanguage = "en-US",
    grammarCheckDebounceTime = 3000, // Increased to 3 seconds to reduce API call frequency
  }, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const editorRef = useRef<HTMLDivElement>(null)
    const overlayRef = useRef<HTMLDivElement>(null)
    const [grammarErrors, setGrammarErrors] = useState<GrammarError[]>([])
    const [hoveredError, setHoveredError] = useState<GrammarError | null>(null)
    const [isGrammarCheckLoading, setIsGrammarCheckLoading] = useState(false)
    // Add a state to track scroll position for re-rendering
    // Initialize with zeros, will be updated in the useEffect
    const [scrollPosition, setScrollPosition] = useState({ top: 0, left: 0 })

    // Store the last processed text to avoid unnecessary processing
    const lastProcessedText = useRef<string>("")

    useImperativeHandle(ref, () => ({
      getTextarea: () => textareaRef.current,
      focus: () => textareaRef.current?.focus()
    }))

    // We don't need to sync scroll position anymore as we'll position highlights absolutely
    // relative to the viewport, accounting for scroll position in the renderGrammarErrors function

    // Add a scroll event listener to update the scroll position state
    useEffect(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Set initial scroll position
      setScrollPosition({
        top: textarea.scrollTop,
        left: textarea.scrollLeft
      });

      const handleScroll = () => {
        setScrollPosition({
          top: textarea.scrollTop,
          left: textarea.scrollLeft
        });
      };

      textarea.addEventListener('scroll', handleScroll);
      return () => {
        textarea.removeEventListener('scroll', handleScroll);
      };
    }, []);

    // Memoize the stripped text and mapping for performance
    const { stripped, mapping } = useMemo(() => {
      if (!grammarCheckEnabled || value === lastProcessedText.current) {
        return { stripped: "", mapping: { originalToStripped: new Map(), strippedToOriginal: new Map() } };
      }
      return stripMarkdownForGrammarCheck(value);
    }, [value, grammarCheckEnabled]);

    // Function to perform grammar check
    const performGrammarCheck = async (text: string) => {
      if (!grammarCheckEnabled || !text.trim()) {
        setGrammarErrors([]);
        setIsGrammarCheckLoading(false);
        return;
      }

      try {
        const errors = await checkGrammar(text, mapping, {
          language: grammarCheckLanguage,
        });

        // Filter out errors in code blocks
        const filteredErrors = errors.filter(
          error => !isInsideCodeBlock(error.originalOffset, value)
        );

        setGrammarErrors(filteredErrors);
        console.log("Grammar errors found:", filteredErrors.length);
      } catch (error) {
        console.error("Grammar check failed:", error);
        setGrammarErrors([]);
      } finally {
        setIsGrammarCheckLoading(false);
      }
    };

    // Process text for grammar checking
    // Use a ref to store the timeout ID
    const grammarCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (!grammarCheckEnabled) {
        return;
      }

      // Clear any existing timeout
      if (grammarCheckTimeoutRef.current) {
        clearTimeout(grammarCheckTimeoutRef.current);
      }

      // Only set loading state if we're actually going to check
      if (value !== lastProcessedText.current && value.trim()) {
        setIsGrammarCheckLoading(true);
      }

      // Set a timeout to process the text after the user has stopped typing
      grammarCheckTimeoutRef.current = setTimeout(() => {
        if (value === lastProcessedText.current) {
          return;
        }

        lastProcessedText.current = value;
        performGrammarCheck(stripped);
      }, grammarCheckDebounceTime);

      // Cleanup function to clear the timeout when the component unmounts
      return () => {
        if (grammarCheckTimeoutRef.current) {
          clearTimeout(grammarCheckTimeoutRef.current);
        }
      };
    }, [value, stripped, grammarCheckEnabled, grammarCheckDebounceTime, grammarCheckLanguage, mapping]);

    // Handle applying a replacement suggestion
    const handleApplyReplacement = (error: GrammarError, replacement: string) => {
      if (!textareaRef.current) return;

      // Save current scroll position
      const currentScrollTop = textareaRef.current.scrollTop;
      const currentScrollLeft = textareaRef.current.scrollLeft;

      // Apply the replacement in the textarea
      const start = error.originalOffset;
      const end = error.originalOffset + error.originalLength;

      const newValue = 
        value.substring(0, start) + 
        replacement + 
        value.substring(end);

      onChange(newValue);

      // Focus the textarea and set cursor position after the replacement
      // while preserving scroll position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newPosition = start + replacement.length;
          textareaRef.current.setSelectionRange(newPosition, newPosition);

          // Restore scroll position
          textareaRef.current.scrollTop = currentScrollTop;
          textareaRef.current.scrollLeft = currentScrollLeft;
        }
      }, 0);
    };

    // Handle adding a word to the custom dictionary
    const handleAddToDictionary = (error: GrammarError) => {
      // Save current scroll position if textarea exists
      const currentScrollTop = textareaRef.current?.scrollTop || 0;
      const currentScrollLeft = textareaRef.current?.scrollLeft || 0;

      const word = value.substring(
        error.originalOffset, 
        error.originalOffset + error.originalLength
      );

      addToDictionary(word, error.rule?.id);

      // Remove the error from the current list
      setGrammarErrors(prev => 
        prev.filter(e => 
          !(e.originalOffset === error.originalOffset && 
            e.originalLength === error.originalLength)
        )
      );

      // Restore scroll position after state update
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.scrollTop = currentScrollTop;
          textareaRef.current.scrollLeft = currentScrollLeft;
        }
      }, 0);
    };

    // Render grammar errors
    const renderGrammarErrors = () => {
      if (!grammarCheckEnabled || !grammarErrors.length) {
        return null;
      }

      console.log("Rendering grammar errors:", grammarErrors.length);

      return grammarErrors.map((error, index) => {
        // Calculate position based on the textarea
        const textarea = textareaRef.current;
        if (!textarea) return null;

        const text = textarea.value;

        // Get the line and column of the error
        const textBeforeError = text.substring(0, error.originalOffset);
        const lines = textBeforeError.split('\n');
        const lineNumber = lines.length - 1;
        const columnNumber = lines[lineNumber].length;

        // Calculate the position of the error within the rendered textarea
        const errorText = text.substring(
          error.originalOffset, 
          error.originalOffset + error.originalLength
        );

        // Use the scrollPosition state for positioning
        const { top: scrollTop, left: scrollLeft } = scrollPosition;

        // Create the error marker element
        return (
          <GrammarContextMenu
            key={`grammar-error-${index}`}
            error={error}
            onApplyReplacement={(replacement) => handleApplyReplacement(error, replacement)}
            onAddToDictionary={() => handleAddToDictionary(error)}
          >
            <div
              className={cn(
                "absolute pointer-events-auto cursor-pointer grammar-error",
                `grammar-error-${error.severity}`
              )}
              style={{
                left: `calc(${columnNumber}ch + 1.5rem - ${scrollLeft}px)`,
                top: `calc(${lineNumber} * 1.5rem + 1rem - ${scrollTop}px)`,
                width: `${errorText.length}ch`,
                height: '1.5rem',
                zIndex: 10,
                backgroundColor: 'transparent',
                borderBottom: '2px dotted',
                borderBottomColor: error.severity === 'error' ? 'rgba(255, 0, 0, 0.7)' : 
                                  error.severity === 'warning' ? 'rgba(255, 165, 0, 0.7)' : 'rgba(0, 0, 255, 0.7)',
                position: 'absolute',
                pointerEvents: 'auto',
              }}
              onMouseEnter={() => setHoveredError(error)}
              onMouseLeave={() => setHoveredError(null)}
              data-testid={`grammar-error-${index}`}
              aria-label={`${error.type} error (${error.severity} severity): ${error.message}`}
            />
          </GrammarContextMenu>
        );
      });
    };

    return (
      <div className={cn("w-full relative", className)} ref={editorRef}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={(e) => {
            const clipboardData = e.clipboardData

            // Check if clipboard contains image data
            if (clipboardData.items && clipboardData.items.length > 0) {
              for (const item of clipboardData.items) {
                // Check if the item is an image
                if (item.type.indexOf('image') !== -1) {
                  e.preventDefault()

                  // Get the image as a blob
                  const blob = item.getAsFile()
                  if (!blob) continue

                  // Read the image as base64 data URL
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    if (!event.target || typeof event.target.result !== 'string') return

                    const imageDataUrl = event.target.result

                    // Check if e.currentTarget exists before destructuring
                    if (!e.currentTarget) {
                      return; // Exit early if currentTarget is null or undefined
                    }

                    // Get the current selection
                    const { selectionStart, selectionEnd } = e.currentTarget
                    const beforeCursor = value.substring(0, selectionStart)
                    const afterCursor = value.substring(selectionEnd)

                    // Use the base64 data URL directly in the Markdown image syntax
                    // This embeds the image data directly in the Markdown
                    const imageMarkdown = `![](${imageDataUrl})`
                    const newValue = beforeCursor + imageMarkdown + afterCursor

                    onChange(newValue)

                    // Position cursor inside the empty brackets
                    setTimeout(() => {
                      if (textareaRef.current) {
                        // Position cursor after the '![' and before the ']'
                        const newCursorPosition = selectionStart + 2
                        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
                        textareaRef.current.focus()
                      }
                    }, 0)
                  }

                  // Begin reading the image file
                  reader.readAsDataURL(blob)
                  return
                }
              }
            }

            // If not an image, continue with URL handling logic
            const pastedText = clipboardData.getData('text')

            // Simple URL validation regex
            const urlRegex = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i

            // Check if e.currentTarget exists before destructuring
            if (!e.currentTarget) {
              return; // Exit early if currentTarget is null or undefined
            }

            // Get the current selection
            const { selectionStart, selectionEnd } = e.currentTarget
            const selectedText = value.substring(selectionStart, selectionEnd)

            if (urlRegex.test(pastedText)) {
              e.preventDefault()

              // If there's selected text, wrap it with the link format
              if (selectedText) {
                const beforeSelection = value.substring(0, selectionStart)
                const afterSelection = value.substring(selectionEnd)
                const newValue = beforeSelection + '[' + selectedText + '](' + pastedText + ')' + afterSelection

                onChange(newValue)

                // Set cursor position after the inserted link
                setTimeout(() => {
                  if (textareaRef.current) {
                    const newCursorPosition = selectionStart + selectedText.length + pastedText.length + 4
                    textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
                    textareaRef.current.focus()
                  }
                }, 0)
              } else {
                // No selection, just insert the link
                const beforeCursor = value.substring(0, selectionStart)
                const afterCursor = value.substring(selectionStart)
                const newValue = beforeCursor + '[Link](' + pastedText + ')' + afterCursor

                onChange(newValue)

                // Set cursor position after the inserted link
                setTimeout(() => {
                  if (textareaRef.current) {
                    const newCursorPosition = selectionStart + pastedText.length + 8
                    textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
                    textareaRef.current.focus()
                  }
                }, 0)
              }
            } else {
              // Handle regular text paste
              e.preventDefault()

              const beforeCursor = value.substring(0, selectionStart)
              const afterCursor = value.substring(selectionEnd)
              const newValue = beforeCursor + pastedText + afterCursor

              onChange(newValue)

              // Set cursor position after the pasted text
              setTimeout(() => {
                if (textareaRef.current) {
                  const newCursorPosition = selectionStart + pastedText.length
                  textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
                  textareaRef.current.focus()
                }
              }, 0)
            }
          }}
          className="h-full w-full resize-none border border-solid border-[hsl(var(--markdown-input-border))] bg-[hsl(var(--markdown-input-bg))] px-6 py-4 font-mono text-sm text-[hsl(var(--markdown-input-text))] leading-relaxed tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-50 shadow-md rounded-md"
          placeholder="Write your markdown here..."
          aria-label="Markdown editor"
          spellCheck="false"
          data-testid="markdown-input"
        />

        {/* Overlay for grammar error highlighting */}
        <div 
          ref={overlayRef}
          className="absolute inset-0 pointer-events-none"
          style={{ 
            overflow: 'hidden', // Changed from 'auto' to 'hidden' to prevent scrolling
            pointerEvents: 'none',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            // Removed scrollTop and scrollLeft as we don't want the overlay to scroll
            fontFamily: 'monospace',
            fontSize: 'inherit',
            lineHeight: '1.5rem',
            padding: '1rem 1.5rem',
          }}
        >
          {renderGrammarErrors()}
        </div>

        {/* Tooltip for hovered grammar error */}
        {hoveredError && (
          <GrammarTooltip
            error={hoveredError}
            onApplyReplacement={(replacement) => handleApplyReplacement(hoveredError, replacement)}
            onAddToDictionary={() => handleAddToDictionary(hoveredError)}
          />
        )}

        {/* Loading indicator for grammar checking */}
        {isGrammarCheckLoading && (
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground flex items-center">
            <svg 
              className="animate-spin h-3 w-3 mr-1" 
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
  }
)
