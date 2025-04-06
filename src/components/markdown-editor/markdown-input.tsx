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
    grammarCheckDebounceTime = 1000,
  }, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const editorRef = useRef<HTMLDivElement>(null)
    const [grammarErrors, setGrammarErrors] = useState<GrammarError[]>([])
    const [hoveredError, setHoveredError] = useState<GrammarError | null>(null)
    const [isGrammarCheckLoading, setIsGrammarCheckLoading] = useState(false)

    // Add state to track textarea scroll position
    const [scrollPosition, setScrollPosition] = useState({ top: 0, left: 0 })

    // Store the last processed text to avoid unnecessary processing
    const lastProcessedText = useRef<string>("")

    useImperativeHandle(ref, () => ({
      getTextarea: () => textareaRef.current,
      focus: () => textareaRef.current?.focus()
    }))

    // Memoize the stripped text and mapping for performance
    const { stripped, mapping } = useMemo(() => {
      if (!grammarCheckEnabled || value === lastProcessedText.current) {
        return { stripped: "", mapping: { originalToStripped: new Map(), strippedToOriginal: new Map() } };
      }
      return stripMarkdownForGrammarCheck(value);
    }, [value, grammarCheckEnabled]);

    // Force re-render of grammar errors when scroll position changes
    useEffect(() => {
      // This effect will trigger a re-render when scrollPosition changes
    }, [scrollPosition]);

    // Create a debounced grammar check function
    const debouncedCheckGrammar = useMemo(
      () => 
        debounce(async (text: string) => {
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
          } catch (error) {
            console.error("Grammar check failed:", error);
            setGrammarErrors([]);
          } finally {
            setIsGrammarCheckLoading(false);
          }
        }, grammarCheckDebounceTime),
      [grammarCheckEnabled, mapping, grammarCheckLanguage, grammarCheckDebounceTime, value]
    );

    // Process text for grammar checking
    useEffect(() => {
      if (!grammarCheckEnabled || value === lastProcessedText.current) {
        return;
      }

      setIsGrammarCheckLoading(true);
      lastProcessedText.current = value;
      debouncedCheckGrammar(stripped);
    }, [value, stripped, debouncedCheckGrammar, grammarCheckEnabled]);

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

        // Get the text content of the line
        const lineStart = text.lastIndexOf('\n', error.originalOffset - 1) + 1;
        const lineEnd = text.indexOf('\n', error.originalOffset);
        const line = text.substring(
          lineStart, 
          lineEnd === -1 ? text.length : lineEnd
        );

        // Calculate the position of the error within the rendered textarea
        let errorText = text.substring(
          error.originalOffset, 
          error.originalOffset + error.originalLength
        );

        // Trim trailing whitespace to ensure underline doesn't extend beyond actual text
        const trailingWhitespace = errorText.match(/\s+$/);
        const trimmedLength = trailingWhitespace 
          ? errorText.length - trailingWhitespace[0].length 
          : errorText.length;

        // Trim leading whitespace to ensure underline starts at the right position
        const leadingWhitespace = errorText.match(/^\s+/);
        const leadingOffset = leadingWhitespace ? leadingWhitespace[0].length : 0;

        // Adjust column number to account for leading whitespace
        const adjustedColumnNumber = columnNumber + leadingOffset;

        // Create the error marker element
        return (
          <GrammarContextMenu
            key={`grammar-error-${index}`}
            error={error}
            onApplyReplacement={(replacement) => handleApplyReplacement(error, replacement)}
            onAddToDictionary={() => handleAddToDictionary(error)}
          >
            <span
              className={cn(
                "inline-block pointer-events-auto cursor-pointer grammar-error",
                `grammar-error-${error.severity}`
              )}
              style={{
                position: 'absolute',
                left: `calc(${adjustedColumnNumber}ch + 1.5rem)`, // Use adjusted column number
                top: `calc(${lineNumber} * 1.5rem + 1rem + 0.25rem)`, // Adjusted to align better with text baseline
                width: `${trimmedLength}ch`, // Use trimmed length for more precise width
                height: '1.2rem', // Reduced height for better precision
                zIndex: 10,
                backgroundColor: 'transparent',
                pointerEvents: 'auto',
                transform: `translate(${-scrollPosition.left}px, ${-scrollPosition.top}px)`,
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

    // Handle scroll events to update marker positions
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    setScrollPosition({
      top: textarea.scrollTop,
      left: textarea.scrollLeft
    });
  };

  return (
      <div className={cn("w-full relative", className)} ref={editorRef}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          className="h-full w-full resize-none border border-solid border-[hsl(var(--markdown-input-border))] bg-[hsl(var(--markdown-input-bg))] px-6 py-4 font-mono text-sm text-[hsl(var(--markdown-input-text))] leading-relaxed tracking-wide focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-50 shadow-md rounded-md"
          placeholder="Write your markdown here..."
          aria-label="Markdown editor"
          spellCheck="false"
          data-testid="markdown-input"
        />

        {/* Overlay for grammar error highlighting */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            overflow: 'hidden',
            pointerEvents: 'none',
            clipPath: 'inset(0 0 0 0)',
          }}
        >
          {renderGrammarErrors()}
        </div>

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
