import { useCallback, useEffect, useRef, useState } from 'react';
import { completeText, shouldTriggerCompletion, getCompletionPrefix, CompletionResult } from '@/lib/nlc';

export interface UseTextCompletionOptions {
  enabled: boolean;
  language?: 'en' | 'de';
  profile?: 'Always' | 'Moderate';
  debounceTime?: number;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
}

export interface UseTextCompletionReturn {
  completions: string[];
  selectedIndex: number;
  isLoading: boolean;
  error: string | null;
  showSuggestions: boolean;
  suggestionPosition: { top: number; left: number };
  acceptCompletion: () => void;
  dismissCompletions: () => void;
  selectNextCompletion: () => void;
  selectPrevCompletion: () => void;
  setSelectedIndex: (index: number) => void;
}

/**
 * Custom hook for text completion functionality
 */
export function useTextCompletion({
  enabled,
  language = 'en',
  profile = 'Moderate',
  debounceTime = 500,
  textareaRef,
  value,
  onChange,
}: UseTextCompletionOptions): UseTextCompletionReturn {
  const [completions, setCompletions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCompletionContext = useRef<string>('');
  const currentPrefix = useRef<string>('');

  /**
   * Calculate position for suggestion popup
   */
  const calculatePosition = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return { top: 0, left: 0 };

    const { selectionStart } = textarea;
    const rect = textarea.getBoundingClientRect();

    // Create a mirror div to measure text position
    const mirror = document.createElement('div');
    const styles = window.getComputedStyle(textarea);

    // Copy relevant styles
    ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight', 'padding', 'border'].forEach(prop => {
      mirror.style[prop as any] = styles[prop as any];
    });

    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.wordWrap = 'break-word';
    mirror.style.width = `${textarea.clientWidth}px`;

    // Add text up to cursor
    mirror.textContent = value.substring(0, selectionStart);

    // Add a marker span for cursor position
    const marker = document.createElement('span');
    marker.textContent = '|';
    mirror.appendChild(marker);

    document.body.appendChild(mirror);

    const markerRect = marker.getBoundingClientRect();
    const position = {
      top: markerRect.top + markerRect.height + window.scrollY,
      left: markerRect.left + window.scrollX,
    };

    document.body.removeChild(mirror);

    return position;
  }, [textareaRef, value]);

  /**
   * Fetch completions from API
   */
  const fetchCompletions = useCallback(async (context: string, cursorPos: number) => {
    if (!enabled || !shouldTriggerCompletion(context, cursorPos)) {
      setShowSuggestions(false);
      return;
    }

    const textBeforeCursor = context.substring(0, cursorPos);

    // Don't fetch if context hasn't changed significantly
    if (textBeforeCursor === lastCompletionContext.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result: CompletionResult = await completeText({
        context: textBeforeCursor,
        language,
        profile,
      });

      // Store the prefix that was used for completion
      currentPrefix.current = result.prefix;
      lastCompletionContext.current = textBeforeCursor;

      if (result.completions && result.completions.length > 0) {
        setCompletions(result.completions);
        setSelectedIndex(0);
        setShowSuggestions(true);
        setSuggestionPosition(calculatePosition());
      } else {
        setShowSuggestions(false);
      }
    } catch (err) {
      console.error('Completion error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch completions');
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, language, profile, calculatePosition]);

  /**
   * Debounced completion trigger
   */
  const triggerCompletion = useCallback((context: string, cursorPos: number) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchCompletions(context, cursorPos);
    }, debounceTime);
  }, [fetchCompletions, debounceTime]);

  /**
   * Accept the selected completion
   */
  const acceptCompletion = useCallback(() => {
    if (!showSuggestions || completions.length === 0) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart } = textarea;
    const completion = completions[selectedIndex];

    if (!completion) return;

    // Find where the prefix starts
    const textBeforeCursor = value.substring(0, selectionStart);
    const prefix = currentPrefix.current;
    const prefixStart = textBeforeCursor.length - prefix.length;

    // Replace the prefix with the full completion
    const newValue =
      value.substring(0, prefixStart) +
      prefix +
      completion +
      value.substring(selectionStart);

    onChange(newValue);

    // Update cursor position
    const newCursorPos = prefixStart + prefix.length + completion.length;

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);

    // Clear completions
    setShowSuggestions(false);
    setCompletions([]);
  }, [showSuggestions, completions, selectedIndex, textareaRef, value, onChange]);

  /**
   * Dismiss completions
   */
  const dismissCompletions = useCallback(() => {
    setShowSuggestions(false);
    setCompletions([]);
  }, []);

  /**
   * Navigate to next completion
   */
  const selectNextCompletion = useCallback(() => {
    if (completions.length === 0) return;
    setSelectedIndex((prev) => (prev + 1) % completions.length);
  }, [completions.length]);

  /**
   * Navigate to previous completion
   */
  const selectPrevCompletion = useCallback(() => {
    if (completions.length === 0) return;
    setSelectedIndex((prev) => (prev - 1 + completions.length) % completions.length);
  }, [completions.length]);

  /**
   * Trigger completion on value change
   */
  useEffect(() => {
    if (!enabled) {
      setShowSuggestions(false);
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    triggerCompletion(value, cursorPos);
  }, [value, enabled, triggerCompletion, textareaRef]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    completions,
    selectedIndex,
    isLoading,
    error,
    showSuggestions,
    suggestionPosition,
    acceptCompletion,
    dismissCompletions,
    selectNextCompletion,
    selectPrevCompletion,
    setSelectedIndex,
  };
}
