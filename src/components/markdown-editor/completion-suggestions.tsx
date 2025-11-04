import React from 'react';

export interface CompletionSuggestionsProps {
  suggestions: string[];
  selectedIndex: number;
  position: { top: number; left: number };
  onSelect: (completion: string) => void;
  onDismiss: () => void;
}

/**
 * Component to display inline text completion suggestions
 */
export const CompletionSuggestions: React.FC<CompletionSuggestionsProps> = ({
  suggestions,
  selectedIndex,
  position,
  onSelect,
  onDismiss,
}) => {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg overflow-hidden"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        minWidth: '200px',
        maxWidth: '400px',
      }}
    >
      <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <span>Text Completion</span>
        <span className="text-[10px]">Tab to accept • Esc to dismiss</span>
      </div>
      <ul className="max-h-60 overflow-y-auto">
        {suggestions.map((suggestion, index) => (
          <li
            key={index}
            className={`px-3 py-2 cursor-pointer transition-colors ${
              index === selectedIndex
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            onClick={() => onSelect(suggestion)}
            onMouseEnter={(e) => {
              // Update selected index on hover
              const target = e.currentTarget;
              const parent = target.parentElement;
              if (parent) {
                const index = Array.from(parent.children).indexOf(target);
                if (index !== selectedIndex) {
                  // Trigger a custom event to update parent state
                  target.dispatchEvent(
                    new CustomEvent('hover-suggestion', {
                      bubbles: true,
                      detail: { index },
                    })
                  );
                }
              }
            }}
          >
            <div className="text-sm font-mono">{suggestion}</div>
          </li>
        ))}
      </ul>
      {suggestions.length > 1 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1 border-t border-gray-200 dark:border-gray-700">
          ↑↓ to navigate • {selectedIndex + 1} of {suggestions.length}
        </div>
      )}
    </div>
  );
};

/**
 * Component to display inline completion preview (ghost text)
 * This creates an overlay that shows the completion text in grey at cursor position
 */
interface InlineCompletionProps {
  completion: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
}

export const InlineCompletion: React.FC<InlineCompletionProps> = ({
  completion,
  textareaRef,
  value,
}) => {
  if (!completion || !textareaRef.current) {
    return null;
  }

  const textarea = textareaRef.current;
  const cursorPosition = textarea.selectionStart;

  // Split text at cursor position
  const textBeforeCursor = value.substring(0, cursorPosition);
  const textAfterCursor = value.substring(cursorPosition);

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10 overflow-hidden"
      style={{
        font: getComputedStyle(textarea).font,
        fontSize: getComputedStyle(textarea).fontSize,
        lineHeight: getComputedStyle(textarea).lineHeight,
        padding: getComputedStyle(textarea).padding,
        border: getComputedStyle(textarea).borderWidth + ' solid transparent',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
      }}
    >
      {/* Invisible text before cursor */}
      <span style={{ opacity: 0, pointerEvents: 'none' }}>{textBeforeCursor}</span>
      {/* Visible ghost text for the completion */}
      <span
        style={{
          color: 'var(--completion-ghost-text, rgba(156, 163, 175, 0.7))',
          fontStyle: 'italic',
          pointerEvents: 'none'
        }}
      >
        {completion}
      </span>
      {/* Invisible text after cursor (if any) */}
      <span style={{ opacity: 0, pointerEvents: 'none' }}>{textAfterCursor}</span>
    </div>
  );
};
