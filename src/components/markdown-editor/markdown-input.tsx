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
    const [grammarErrors, setGrammarErrors] = useState<GrammarError[]>([])
    const [hoveredError, setHoveredError] = useState<GrammarError | null>(null)
    const [isGrammarCheckLoading, setIsGrammarCheckLoading] = useState(false)

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
                left: `calc(${columnNumber}ch + 1.5rem)`,
                top: `calc(${lineNumber} * 1.5rem + 1rem)`,
                width: `${errorText.length}ch`,
                height: '1.5rem',
                zIndex: 10,
                backgroundColor: 'transparent',
              }}
              onMouseEnter={() => setHoveredError(error)}
              onMouseLeave={() => setHoveredError(null)}
              data-testid={`grammar-error-${index}`}
              aria-label={`${error.type} error (${error.severity} severity): ${error.message}`}
            >
              {errorText}
            </div>
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
