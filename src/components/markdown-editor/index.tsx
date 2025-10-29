"use client"

import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
  hasRecoverableContent,
  getTimeSinceLastSave,
} from "@/lib/auto-save"

import { MarkdownInput, MarkdownInputHandle } from "./markdown-input"
import { MarkdownPreview } from "./markdown-preview"
import { MarkdownSidebar } from "./markdown-sidebar"
import { MarkdownToolbar } from "./markdown-toolbar"
import { OutlineTrigger } from "./outline-trigger"
import { ReadingStats } from "./reading-stats"

export interface MarkdownEditorProps {
  initialValue?: string
  className?: string
  onChange?: (value: string) => void
  sidebarEnabled?: boolean
}

export function MarkdownEditor({
  initialValue = "",
  className,
  onChange,
  sidebarEnabled = true,
}: MarkdownEditorProps) {
  const [markdown, setMarkdown] = useState(initialValue)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [currentFileName, setCurrentFileName] = useState<string | null>(null)
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(
    null
  )
  const [isFileSaved, setIsFileSaved] = useState(true)
  const [isFileSystemAPISupported, setIsFileSystemAPISupported] =
    useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false)
  const [recoveredContent, setRecoveredContent] = useState<string | null>(null)
  const [recoveryTimestamp, setRecoveryTimestamp] = useState<number | null>(
    null
  )

  // Distraction-free mode states
  const [isDistractionFree, setIsDistractionFree] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  // Active heading tracking for outline
  const [activeHeadingId, setActiveHeadingId] = useState<string>("")

  // Undo history management
  const [undoStack, setUndoStack] = useState<string[]>([initialValue])
  const [redoStack, setRedoStack] = useState<string[]>([])
  const [isUndoRedoOperation, setIsUndoRedoOperation] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const markdownInputRef = useRef<MarkdownInputHandle>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const localStorageAutoSaveRef = useRef<NodeJS.Timeout | null>(null)

  // Check if File System Access API is supported
  useEffect(() => {
    setIsFileSystemAPISupported(
      "showOpenFilePicker" in window && "showSaveFilePicker" in window
    )
  }, [])

  // Check for recoverable content on mount (client-side only)
  useEffect(() => {
    if (typeof window === "undefined") return

    if (hasRecoverableContent()) {
      const data = loadFromLocalStorage()
      if (data && data.content !== initialValue) {
        setRecoveredContent(data.content)
        setRecoveryTimestamp(data.timestamp)
        setShowRecoveryBanner(true)
      }
    }
  }, [initialValue])

  // Auto-save to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    // Clear any existing timeout
    if (localStorageAutoSaveRef.current) {
      clearTimeout(localStorageAutoSaveRef.current)
    }

    // Debounce the save to localStorage (save after 2 seconds of inactivity)
    localStorageAutoSaveRef.current = setTimeout(() => {
      if (markdown.trim().length > 0) {
        saveToLocalStorage(markdown)
      }
    }, 2000)

    return () => {
      if (localStorageAutoSaveRef.current) {
        clearTimeout(localStorageAutoSaveRef.current)
      }
    }
  }, [markdown])

  // Auto-save effect that triggers when markdown content changes
  useEffect(() => {
    // Only auto-save if a file is open and auto-save is enabled
    if (autoSaveEnabled && fileHandle && !isFileSaved) {
      // Clear any existing timeout to prevent multiple saves
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }

      // Set a new timeout to save after 1 second of inactivity
      autoSaveTimeoutRef.current = setTimeout(() => {
        handleSaveFile()
      }, 1000)
    }

    // Cleanup function to clear timeout when component unmounts or dependencies change
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [markdown, autoSaveEnabled, fileHandle, isFileSaved])

  // Full-screen mode effect
  useEffect(() => {
    if (isFullScreen && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Could not enter fullscreen mode:", err)
      })
    } else if (!isFullScreen && document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.warn("Could not exit fullscreen mode:", err)
      })
    }

    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullScreen) {
        setIsFullScreen(false)
        setIsDistractionFree(false)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [isFullScreen])

  // Track active heading for outline position indicator
  useEffect(() => {
    if (!isPreviewMode) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the heading that's most visible at the top of the viewport
        const visibleHeadings = entries.filter((entry) => entry.isIntersecting)

        if (visibleHeadings.length > 0) {
          // Sort by position in viewport (topmost first)
          visibleHeadings.sort((a, b) => {
            return a.boundingClientRect.top - b.boundingClientRect.top
          })

          const topHeading = visibleHeadings[0]
          if (topHeading.target.id) {
            setActiveHeadingId(topHeading.target.id)
          }
        }
      },
      {
        rootMargin: "-10% 0px -80% 0px", // Trigger when heading is near the top
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    )

    // Observe all headings in the preview
    const headings = document.querySelectorAll(
      '[data-testid="markdown-preview"] h1[id], [data-testid="markdown-preview"] h2[id], [data-testid="markdown-preview"] h3[id], [data-testid="markdown-preview"] h4[id], [data-testid="markdown-preview"] h5[id], [data-testid="markdown-preview"] h6[id]'
    )

    headings.forEach((heading) => observer.observe(heading))

    return () => {
      headings.forEach((heading) => observer.unobserve(heading))
    }
  }, [isPreviewMode, markdown])

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey

      // Global shortcut to focus textarea: 'i'
      if (
        event.key === "i" &&
        !isCtrlOrCmd &&
        !event.altKey &&
        !event.shiftKey
      ) {
        // Only activate if not already in a text input
        const activeElement = document.activeElement
        const isInputActive =
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement

        if (!isInputActive && !isPreviewMode) {
          event.preventDefault()
          markdownInputRef.current?.focus()
        }
      }

      // Toggle view mode: 'ESC'
      if (event.key === "Escape") {
        event.preventDefault()
        if (isFullScreen || isDistractionFree) {
          // Exit all distraction-free modes first
          setIsFullScreen(false)
          setIsDistractionFree(false)
        } else {
          setIsPreviewMode(!isPreviewMode)
        }
      }

      // F11 or CMD+SHIFT+F: Toggle full-screen distraction-free mode
      if (event.key === "F11" || (isCtrlOrCmd && event.shiftKey && event.key === "F")) {
        event.preventDefault()
        setIsFullScreen(!isFullScreen)
        setIsDistractionFree(!isFullScreen) // Enable distraction-free when going full-screen
      }

      // CMD+SHIFT+D: Toggle distraction-free mode
      if (isCtrlOrCmd && event.shiftKey && event.key === "D") {
        event.preventDefault()
        setIsDistractionFree(!isDistractionFree)
      }

      // Only process these shortcuts if editor element has focus
      const editorHasFocus =
        editorRef.current?.contains(document.activeElement) || false
      if (!editorHasFocus) return

      if (isCtrlOrCmd) {
        switch (event.key) {
          case "s": // Format/Save: 'CTRL/CMD + S'
            event.preventDefault()
            handleSaveFile()
            break

          case "b": // Bold: 'CTRL/CMD + B'
            event.preventDefault()
            if (!isPreviewMode) {
              handleInsertAction("**Bold text**")
            }
            break

          case "i": // Italic: 'CTRL/CMD + I'
            event.preventDefault()
            if (!isPreviewMode) {
              handleInsertAction("*Italic text*")
            }
            break

          case "k": // Link: 'CTRL/CMD + K'
            event.preventDefault()
            if (!isPreviewMode) {
              handleInsertAction("[Link text](https://example.com)")
            }
            break

          case "c": // Code block: 'CTRL/CMD + SHIFT + C'
            if (event.shiftKey) {
              event.preventDefault()
              if (!isPreviewMode) {
                handleInsertAction(
                  "\n```\nconst example = 'code block';\n```\n"
                )
              }
            }
            break

          case "[": // Anchor: 'CTRL/CMD + ['
            event.preventDefault()
            if (!isPreviewMode) {
              handleInsertAction("[Link text](https://example.com)")
            }
            break

          case "]": // Image: 'CTRL/CMD + ]'
            event.preventDefault()
            if (!isPreviewMode) {
              handleInsertAction(
                "![Image alt text](https://example.com/image.jpg)"
              )
            }
            break

          case "\\": // Table: 'CTRL/CMD + \'
            event.preventDefault()
            if (!isPreviewMode) {
              handleInsertAction(
                "\n| Header 1 | Header 2 | Header 3 |\n| -------- | -------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n"
              )
            }
            break

          case "z": // Undo: 'CTRL/CMD + Z'
            event.preventDefault()
            if (!isPreviewMode) {
              // Check if shift is pressed for redo
              if (event.shiftKey) {
                handleRedo()
              } else {
                handleUndo()
              }
            }
            break

          case "y": // Redo: 'CTRL/CMD + Y' (alternative to CTRL/CMD + Shift + Z)
            event.preventDefault()
            if (!isPreviewMode) {
              handleRedo()
            }
            break
        }
      }
    }

    // Add event listener to window
    window.addEventListener("keydown", handleKeyDown)

    // Cleanup function
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isPreviewMode, markdown, undoStack, redoStack, isFullScreen, isDistractionFree]) // Re-register when relevant state changes

  const handleUndo = () => {
    if (undoStack.length <= 1) return // Keep at least the initial state

    setIsUndoRedoOperation(true)

    // Move current state to redo stack
    const newUndoStack = [...undoStack]
    const currentState = newUndoStack.pop() // Remove current state
    const previousState = newUndoStack[newUndoStack.length - 1] // Get previous state

    if (currentState) {
      setRedoStack([...redoStack, currentState])
    }

    // Apply previous state
    setUndoStack(newUndoStack)
    setMarkdown(previousState || "")
    onChange?.(previousState || "")

    // Clear undo/redo flag after state updates
    setTimeout(() => setIsUndoRedoOperation(false), 0)
  }

  const handleRedo = () => {
    if (redoStack.length === 0) return

    setIsUndoRedoOperation(true)

    // Get state to restore from redo stack
    const newRedoStack = [...redoStack]
    const stateToRestore = newRedoStack.pop()

    // Apply state and update stacks
    setRedoStack(newRedoStack)
    if (stateToRestore) {
      setUndoStack([...undoStack, stateToRestore])
      setMarkdown(stateToRestore)
      onChange?.(stateToRestore)
    }

    // Clear undo/redo flag after state updates
    setTimeout(() => setIsUndoRedoOperation(false), 0)
  }

  const handleChange = (value: string) => {
    setMarkdown(value)
    setIsFileSaved(false)
    onChange?.(value)

    // Only add to undo stack if this is not an undo/redo operation
    if (!isUndoRedoOperation) {
      // Add new state to undo stack and clear redo stack
      setUndoStack([...undoStack, value])
      setRedoStack([])
    }
  }

  /**
   * Inserts text at the cursor position in the editor
   *
   * @param text - The text to insert at the cursor position
   * @returns The inserted text
   */
  const handleInsertAction = (text: string): string => {
    const textarea = markdownInputRef.current?.getTextarea()

    if (!textarea) {
      // Fallback if textarea reference is not available
      handleChange(markdown + text)
      return text
    }

    // Save the current scroll position
    const scrollTop = textarea.scrollTop
    const scrollLeft = textarea.scrollLeft

    const { selectionStart, selectionEnd } = textarea
    const selectedText = markdown.substring(selectionStart, selectionEnd)
    const beforeSelection = markdown.substring(0, selectionStart)
    const afterSelection = markdown.substring(selectionEnd)

    let newValue = ""
    let newCursorPosition = 0
    let insertedText = text

    // Check if there's selected text to wrap
    if (selectedText) {
      if (text.includes("**Bold text**")) {
        insertedText = `**${selectedText}**`
        newValue = beforeSelection + insertedText + afterSelection
        newCursorPosition = selectionStart + 2 + selectedText.length + 2
      } else if (text.includes("*Italic text*")) {
        insertedText = `*${selectedText}*`
        newValue = beforeSelection + insertedText + afterSelection
        newCursorPosition = selectionStart + 1 + selectedText.length + 1
      } else if (text.includes("[Link text]")) {
        insertedText = `[${selectedText}](https://example.com)`
        newValue = beforeSelection + insertedText + afterSelection
        newCursorPosition = selectionStart + 1 + selectedText.length + 1
      } else if (text.includes("![Image alt text]")) {
        insertedText = `![${selectedText}](https://example.com/image.jpg)`
        newValue = beforeSelection + insertedText + afterSelection
        newCursorPosition = selectionStart + 2 + selectedText.length + 1
      } else if (text.includes("\n# Heading 1\n")) {
        // Special handling for headings with selection
        insertedText = `# ${selectedText}`
        newValue = beforeSelection + insertedText + afterSelection
        newCursorPosition = selectionStart + 2 + selectedText.length
      } else if (text.includes("\n## Heading 2\n")) {
        // Special handling for headings with selection
        insertedText = `## ${selectedText}`
        newValue = beforeSelection + insertedText + afterSelection
        newCursorPosition = selectionStart + 3 + selectedText.length
      } else {
        // For other blocks, just insert the text
        newValue = beforeSelection + text + afterSelection
        newCursorPosition = selectionStart + text.length
      }
    } else {
      // No selection, just insert the text
      newValue = beforeSelection + text + afterSelection
      newCursorPosition = selectionStart + text.length
    }

    // Update the markdown content
    handleChange(newValue)

    // After React re-renders, restore scroll position and set cursor position
    setTimeout(() => {
      const textareaElement = markdownInputRef.current?.getTextarea()
      if (textareaElement) {
        // Restore the scroll position BEFORE focusing to prevent auto-scroll
        textareaElement.scrollTop = scrollTop
        textareaElement.scrollLeft = scrollLeft
        textareaElement.focus({ preventScroll: true })
        textareaElement.setSelectionRange(newCursorPosition, newCursorPosition)
        // Ensure scroll position is maintained after selection
        textareaElement.scrollTop = scrollTop
        textareaElement.scrollLeft = scrollLeft
      }
    }, 0)

    return insertedText
  }

  const handleRecoverContent = () => {
    if (recoveredContent) {
      setMarkdown(recoveredContent)
      setUndoStack([recoveredContent])
      setRedoStack([])
      onChange?.(recoveredContent)
      setIsFileSaved(false)
    }
    setShowRecoveryBanner(false)
  }

  const handleDismissRecovery = () => {
    setShowRecoveryBanner(false)
    clearLocalStorage()
  }

  const handleNewFile = async () => {
    if (
      !isFileSaved &&
      !window.confirm(
        "Are you sure you want to create a new file? Any unsaved changes will be lost."
      )
    ) {
      return
    }

    setMarkdown("")
    setCurrentFileName(null)
    setFileHandle(null)
    setIsFileSaved(true)
    // Disable auto-save for new files until they're saved
    setAutoSaveEnabled(false)

    // Reset undo/redo stacks for new file
    setUndoStack([""])
    setRedoStack([])

    // Clear localStorage when creating a new file
    clearLocalStorage()

    onChange?.("")
  }

  // Save to the currently open file using File System Access API
  const handleSaveFile = async () => {
    // If we already have a file handle, use it to save directly
    if (isFileSystemAPISupported && fileHandle) {
      try {
        const writableStream = await fileHandle.createWritable()
        await writableStream.write(markdown)
        await writableStream.close()
        setIsFileSaved(true)
        // Clear localStorage after successful save
        clearLocalStorage()
        return
      } catch (error) {
        console.error("Error saving file:", error)
        // Fall back to save as if there's an error
      }
    }

    // If no file handle or not supported, use Save As functionality
    await handleSaveFileAs()
  }

  // Save As functionality using File System Access API
  const handleSaveFileAs = async () => {
    if (isFileSystemAPISupported) {
      try {
        const options = {
          types: [
            {
              description: "Markdown files",
              accept: {
                "text/markdown": [".md", ".markdown"],
              },
            },
          ],
          suggestedName: currentFileName || "untitled.md",
        }

        const newFileHandle = await window.showSaveFilePicker(options)
        const writableStream = await newFileHandle.createWritable()
        await writableStream.write(markdown)
        await writableStream.close()

        setFileHandle(newFileHandle)
        setCurrentFileName(newFileHandle.name)
        setIsFileSaved(true)
        // Enable auto-save after a successful save
        setAutoSaveEnabled(true)
        // Clear localStorage after successful save
        clearLocalStorage()
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error saving file:", error)
          fallbackSaveFile()
        }
      }
    } else {
      fallbackSaveFile()
    }
  }

  // Fallback method for browsers that don't support File System Access API
  const fallbackSaveFile = () => {
    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = currentFileName || "untitled.md"
    document.body.appendChild(link)
    link.click()

    // Clean up
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleOpenFile = async () => {
    if (isFileSystemAPISupported) {
      try {
        const options = {
          types: [
            {
              description: "Markdown files",
              accept: {
                "text/markdown": [".md", ".markdown"],
                "text/plain": [".txt"],
              },
            },
          ],
          multiple: false,
        }

        const [handle] = await window.showOpenFilePicker(options)
        const file = await handle.getFile()
        const content = await file.text()

        // Update content with reset undo/redo stacks
        setMarkdown(content)
        setUndoStack([content])
        setRedoStack([])

        setCurrentFileName(file.name)
        setFileHandle(handle)
        setIsFileSaved(true)
        // Enable auto-save after a file is opened
        setAutoSaveEnabled(true)
        onChange?.(content)
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error opening file:", error)
          // Fall back to traditional file input if there's an error
          if (fileInputRef.current) {
            fileInputRef.current.click()
          }
        }
      }
    } else {
      // Fall back to traditional file input for unsupported browsers
      if (fileInputRef.current) {
        fileInputRef.current.click()
      }
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string

      // Update content with reset undo/redo stacks
      setMarkdown(content)
      setUndoStack([content])
      setRedoStack([])

      setCurrentFileName(file.name)
      setFileHandle(null) // Reset file handle as we don't have one with this method
      setIsFileSaved(true)
      // Can't enable full auto-save without a file handle, but we'll set this
      // to show the user that auto-save is conceptually enabled
      setAutoSaveEnabled(true)
      onChange?.(content)
    }
    reader.readAsText(file)

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Navigate to a heading in the document
  const handleHeadingClick = (headingId: string) => {
    if (!headingId) return

    // Find element by ID and scroll to it
    const element = document.getElementById(headingId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    } else if (markdownInputRef.current) {
      // In edit mode, we need to find the heading position in the text
      const textarea = markdownInputRef.current.getTextarea()
      if (!textarea) return

      // Search for the heading in the markdown text
      const headingText = headingId
        .replace(/-/g, " ") // Convert hyphens back to spaces
        .replace(/\b\w/g, (c) => c.toUpperCase()) // Capitalize first letter of each word

      // Search for the heading pattern in markdown
      const regex = new RegExp(`^(#+)\\s+${headingText}`, "mi")
      const match = regex.exec(markdown)

      if (match && textarea) {
        const index = match.index
        textarea.focus()
        textarea.setSelectionRange(index, index)

        // Calculate position to scroll
        const lines = markdown.substring(0, index).split("\n")
        const lineHeight = 20 // Approximate line height in pixels
        const scrollPosition = lines.length * lineHeight

        textarea.scrollTop = scrollPosition - 100 // Scroll a bit above the heading
      }
    }
  }

  return (
    <div className={cn(
      "editor-wrapper",
      isFullScreen && "fixed inset-0 z-50 bg-background",
      className
    )}>
      {/* Recovery Banner - hide in distraction-free modes */}
      {showRecoveryBanner && recoveredContent && recoveryTimestamp && !isDistractionFree && (
        <div className="mb-4 rounded-md border border-amber-500 bg-amber-50 p-4 dark:bg-amber-950">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-amber-900 dark:text-amber-100">
                Recover unsaved content?
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                We found unsaved content from{" "}
                {getTimeSinceLastSave(recoveryTimestamp)}. Would you like to
                recover it?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRecoverContent}
                className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Recover
              </button>
              <button
                onClick={handleDismissRecovery}
                className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:border-amber-700 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={editorRef}
        className={cn(
          "editor-container flex w-full flex-col bg-background",
          !isDistractionFree && "rounded-md border border-input shadow-sm",
          isFullScreen && "h-full",
          isDistractionFree && "min-h-screen"
        )}
        data-testid="markdown-editor"
      >
      <MarkdownToolbar
        isPreviewMode={isPreviewMode}
        onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
        onInsertAction={handleInsertAction}
        onNewFile={handleNewFile}
        onSaveFile={handleSaveFile}
        onSaveFileAs={handleSaveFileAs}
        onOpenFile={handleOpenFile}
        isFileSystemAPISupported={isFileSystemAPISupported}
        currentFileName={currentFileName}
        isFileSaved={isFileSaved}
        autoSaveEnabled={autoSaveEnabled}
        // Distraction-free mode props
        isDistractionFree={isDistractionFree}
        isFullScreen={isFullScreen}
        onToggleDistractionFree={() => setIsDistractionFree(!isDistractionFree)}
        onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
      />

      <div className="relative flex flex-1 flex-col sm:flex-row">
        {/* Sidebar - hide when distraction-free is active */}
        {sidebarEnabled && !isDistractionFree && (
          <MarkdownSidebar
            content={markdown}
            onHeadingClick={handleHeadingClick}
            isCollapsed={isSidebarCollapsed}
            activeHeadingId={activeHeadingId}
            className="hidden sm:block" // Hide on mobile
          />
        )}

        {/* Left-edge outline trigger - hide when distraction-free is active */}
        {sidebarEnabled && !isDistractionFree && (
          <OutlineTrigger
            isCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="editor-container:hover:opacity-60"
          />
        )}

        {/* Editor or Preview */}
        <div className={cn(
          "flex flex-1 flex-col",
          isDistractionFree && "max-w-4xl mx-auto px-8 py-4"
        )}>
          {!isPreviewMode && (
            <MarkdownInput
              value={markdown}
              onChange={handleChange}
              className={cn(
                "flex-1",
                isDistractionFree ? "border-0 p-6 text-lg leading-relaxed focus:ring-0" : "p-2"
              )}
              ref={markdownInputRef}
            />
          )}
          {isPreviewMode && (
            <MarkdownPreview
              source={markdown}
              className={cn(
                "flex-1",
                !isDistractionFree && "dark:border-gray-700 sm:border-l",
                isDistractionFree && "prose prose-lg max-w-none p-6"
              )}
            />
          )}

          {/* Reading Stats - hide in distraction-free mode */}
          {!isDistractionFree && (
            <ReadingStats content={markdown} className="border-t" />
          )}
        </div>
      </div>

      {/* Hidden file input for opening files (fallback method) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".md,.markdown,.txt"
        className="hidden"
        data-testid="file-input"
      />
    </div>
    </div>
  )
}
