"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import { clearLocalStorage, getTimeSinceLastSave } from "@/lib/auto-save"
import { createLocalStore } from "@/lib/documents/local-store"
import { DocumentStore } from "@/lib/documents/types"
import { useDocumentPersistence } from "@/hooks/use-document-persistence"
import { replaceEmojis } from "@/lib/emoji"
import { extractHeadings } from "@/lib/markdown-headings"
import { renderMarkdown } from "@/lib/markdown-pipeline"

import { MarkdownInput, MarkdownInputHandle } from "./markdown-input"
import { MarkdownPreview } from "./markdown-preview"
import { OptimizedPreview } from "./optimized-preview"
import { MarkdownSidebar } from "./markdown-sidebar"
import { MarkdownToolbar } from "./markdown-toolbar"
import { OutlineTrigger } from "./outline-trigger"
import { ReadingStats } from "./reading-stats"
import { DraggableTodoPopup } from "@/components/ui/draggable-todo-popup"
import { ConflictDialog } from "@/components/documents/conflict-dialog"

export interface CloudDocumentInfo {
  id: string
  title: string
  /** Server version of initialValue */
  version: number
}

const MAX_UNDO_HISTORY = 200

async function writeToFileHandle(handle: FileSystemFileHandle, content: string) {
  const writableStream = await handle.createWritable()
  await writableStream.write(content)
  await writableStream.close()
}

export interface MarkdownEditorProps {
  initialValue?: string
  className?: string
  onChange?: (value: string) => void
  sidebarEnabled?: boolean
  /** Present when editing a signed-in user's cloud document */
  cloudDocument?: CloudDocumentInfo
  /** Where content is autosaved; defaults to the guest localStorage draft */
  store?: DocumentStore
  /** Rendered at the end of the toolbar (e.g. the account menu) */
  toolbarEndSlot?: React.ReactNode
  /** Cloud mode: "New" creates a new document */
  onNewDocument?: () => void
  /** Cloud mode: "Open" imports a file as a new document */
  onImportFile?: (content: string, fileName: string) => void
  /** Cloud mode: conflict resolution "Save mine as copy". Resolves true once saved */
  onSaveCopy?: (content: string) => Promise<boolean>
}

export function MarkdownEditor({
  initialValue = "",
  className,
  onChange,
  sidebarEnabled = true,
  cloudDocument,
  store: providedStore,
  toolbarEndSlot,
  onNewDocument,
  onImportFile,
  onSaveCopy,
}: MarkdownEditorProps) {
  const [markdown, setMarkdown] = useState(initialValue)
  const fallbackStore = useMemo(() => createLocalStore(), [])
  const store = providedStore ?? fallbackStore
  const isCloud = store.kind === "cloud"
  const persistence = useDocumentPersistence({
    store,
    content: markdown,
    initialContent: initialValue,
    initialVersion: cloudDocument?.version ?? null,
  })
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false)
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

  // Todo popup state
  const [isTodoOpen, setIsTodoOpen] = useState(false)

  // Undo history management
  const [undoStack, setUndoStack] = useState<string[]>([initialValue])
  const [redoStack, setRedoStack] = useState<string[]>([])

  // Text completion settings
  const [textCompletionEnabled, setTextCompletionEnabled] = useState(true)
  const [textCompletionLanguage, setTextCompletionLanguage] = useState<'en' | 'de'>('en')
  const [textCompletionProfile, setTextCompletionProfile] = useState<'Always' | 'Moderate'>('Moderate')

  const lineCount = useMemo(() => {
    let count = 1
    for (let i = 0; i < markdown.length; i++) {
      if (markdown.charCodeAt(i) === 10) count++
    }
    return count
  }, [markdown])

  const useOptimizedPreview = useMemo(
    () => lineCount >= 400 || markdown.length >= 15000,
    [lineCount, markdown.length]
  )

  const fileInputRef = useRef<HTMLInputElement>(null)
  const markdownInputRef = useRef<MarkdownInputHandle>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if File System Access API is supported
  useEffect(() => {
    setIsFileSystemAPISupported(
      "showOpenFilePicker" in window && "showSaveFilePicker" in window
    )
  }, [])

  // Check for recoverable content on mount (client-side only).
  // Autosave itself (debounce, flush on hide/close) is handled by
  // useDocumentPersistence.
  useEffect(() => {
    if (typeof window === "undefined") return

    const backup = store.readBackup()
    if (backup && backup.content !== initialValue) {
      setRecoveredContent(backup.content)
      setRecoveryTimestamp(backup.savedAt)
      setShowRecoveryBanner(true)
    }
  }, [initialValue, store])

  // Surface version conflicts as soon as they happen
  useEffect(() => {
    if (persistence.conflict) setIsConflictDialogOpen(true)
  }, [persistence.conflict])

  // Auto-save effect that triggers when markdown content changes
  useEffect(() => {
    // Only auto-save if a file is open and auto-save is enabled
    if (autoSaveEnabled && fileHandle && !isFileSaved) {
      // Clear any existing timeout to prevent multiple saves
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }

      // Set a new timeout to save after 1 second of inactivity.
      // This runs without a user gesture, so it must never open a file picker.
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          await writeToFileHandle(fileHandle, markdown)
          setIsFileSaved(true)
          clearLocalStorage()
        } catch (error) {
          console.error("Auto-save failed:", error)
          setAutoSaveEnabled(false)
        }
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

    // Observe all headings in the preview. The preview HTML is rendered
    // asynchronously, so re-collect headings whenever its DOM changes.
    const observeHeadings = () => {
      observer.disconnect()
      editorRef.current
        ?.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]")
        .forEach((heading) => observer.observe(heading))
    }
    observeHeadings()

    const mutationObserver = new MutationObserver(observeHeadings)
    if (editorRef.current) {
      mutationObserver.observe(editorRef.current, { childList: true, subtree: true })
    }

    return () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }, [isPreviewMode])

  // Keyboard shortcuts handler. It is re-created every render and read
  // through a ref, so it always sees the current state and handlers.
  const keyDownHandlerRef = useRef<(event: KeyboardEvent) => void>(() => {})
  keyDownHandlerRef.current = (event: KeyboardEvent) => {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey
    // With Shift held, letter keys report uppercase ("C", "Z")
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key

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
    // Skip if a popup, menu or suggestion list already handled this Escape
    if (event.key === "Escape" && !event.defaultPrevented) {
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
    if (event.key === "F11" || (isCtrlOrCmd && event.shiftKey && key === "f")) {
      event.preventDefault()
      setIsFullScreen(!isFullScreen)
      setIsDistractionFree(!isFullScreen) // Enable distraction-free when going full-screen
    }

    // CMD+SHIFT+D: Toggle distraction-free mode
    if (isCtrlOrCmd && event.shiftKey && key === "d") {
      event.preventDefault()
      setIsDistractionFree(!isDistractionFree)
    }

    // Only process these shortcuts if editor element has focus
    const editorHasFocus =
      editorRef.current?.contains(document.activeElement) || false
    if (!editorHasFocus) return

    if (isCtrlOrCmd) {
      switch (key) {
        case "s": // Format/Save: 'CTRL/CMD + S'
          event.preventDefault()
          if (isCloud) {
            void persistence.flush()
          } else {
            handleSaveFile()
          }
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) =>
      keyDownHandlerRef.current(event)

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const handleUndo = useCallback(() => {
    if (undoStack.length <= 1) return // Keep at least the initial state

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
    setIsFileSaved(false)
    onChange?.(previousState || "")
  }, [undoStack, redoStack, onChange])

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return

    // Get state to restore from redo stack
    const newRedoStack = [...redoStack]
    const stateToRestore = newRedoStack.pop()

    // Apply state and update stacks
    setRedoStack(newRedoStack)
    if (stateToRestore) {
      setUndoStack([...undoStack, stateToRestore])
      setMarkdown(stateToRestore)
      setIsFileSaved(false)
      onChange?.(stateToRestore)
    }
  }, [redoStack, undoStack, onChange])

  const handleChange = useCallback((value: string) => {
    setMarkdown(value)
    setIsFileSaved(false)
    onChange?.(value)

    // Add new state to undo stack (bounded) and clear redo stack
    setUndoStack((prev) => [...prev, value].slice(-MAX_UNDO_HISTORY))
    setRedoStack([])
  }, [onChange])

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

    // Read the live textarea value: async callers (Unsplash, AI, uploads)
    // may hold a closure from before the user kept typing
    const { selectionStart, selectionEnd, value: currentValue } = textarea
    const selectedText = currentValue.substring(selectionStart, selectionEnd)
    const beforeSelection = currentValue.substring(0, selectionStart)
    const afterSelection = currentValue.substring(selectionEnd)

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
        const url = text.match(/\]\(([^)]*)\)/)?.[1] || "https://example.com"
        insertedText = `[${selectedText}](${url})`
        newValue = beforeSelection + insertedText + afterSelection
        newCursorPosition = selectionStart + insertedText.length
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

  const handleRecoverContent = useCallback(() => {
    // An empty cloud backup (all text deleted offline) is valid too
    if (recoveredContent !== null) {
      setMarkdown(recoveredContent)
      setUndoStack([recoveredContent])
      setRedoStack([])
      onChange?.(recoveredContent)
      setIsFileSaved(false)
    }
    setShowRecoveryBanner(false)
  }, [recoveredContent, onChange])

  const handleDismissRecovery = useCallback(() => {
    setShowRecoveryBanner(false)
    store.clearBackup()
  }, [store])

  const handleNewFile = useCallback(async () => {
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
  }, [isFileSaved, onChange])

  const downloadFileName = isCloud
    ? `${cloudDocument?.title ?? "untitled"}.md`
    : currentFileName || "untitled.md"

  // Fallback method for browsers that don't support File System Access API
  // (and "Download .md" for cloud documents)
  const fallbackSaveFile = useCallback(() => {
    const blob = new Blob([markdown], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = downloadFileName
    document.body.appendChild(link)
    link.click()

    // Clean up
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [markdown, downloadFileName])

  // Save As functionality using File System Access API
  const handleSaveFileAs = useCallback(async () => {
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
        await writeToFileHandle(newFileHandle, markdown)

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
  }, [isFileSystemAPISupported, currentFileName, markdown, fallbackSaveFile])

  // Save to the currently open file using File System Access API
  const handleSaveFile = useCallback(async () => {
    // If we already have a file handle, use it to save directly
    if (isFileSystemAPISupported && fileHandle) {
      try {
        await writeToFileHandle(fileHandle, markdown)
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
  }, [isFileSystemAPISupported, fileHandle, markdown, handleSaveFileAs])

  // Export to PDF functionality
  const handleExportToPDF = useCallback(async () => {
    try {
      const renderHTML = (markdown: string): Promise<string> =>
        renderMarkdown(replaceEmojis(markdown))

      const fileName = isCloud
        ? downloadFileName.replace(/\.md$/, ".pdf")
        : currentFileName
          ? currentFileName.replace(/\.md$/, ".pdf")
          : "document.pdf"

      // jspdf and html2canvas are large, so load them only when exporting
      const { exportToPDF } = await import("@/lib/pdf-export")
      await exportToPDF({
        fileName,
        markdown,
        renderHTML,
      })
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      alert("Failed to export PDF. Please try again.")
    }
  }, [markdown, currentFileName, isCloud, downloadFileName])

  const handleOpenFile = useCallback(async () => {
    // Cloud mode imports the file as a new document via the file input
    if (isFileSystemAPISupported && !isCloud) {
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
  }, [isFileSystemAPISupported, isCloud, onChange])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string

      if (isCloud) {
        onImportFile?.(content, file.name)
        return
      }

      // Update content with reset undo/redo stacks
      setMarkdown(content)
      setUndoStack([content])
      setRedoStack([])

      setCurrentFileName(file.name)
      setFileHandle(null) // Reset file handle as we don't have one with this method
      setIsFileSaved(true)
      // Without a file handle there is nothing to auto-save to
      setAutoSaveEnabled(false)
      onChange?.(content)
    }
    reader.readAsText(file)

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }, [onChange, isCloud, onImportFile])

  const handleKeepMine = useCallback(() => {
    setIsConflictDialogOpen(false)
    void persistence.overwriteRemote()
  }, [persistence])

  const handleLoadLatest = useCallback(() => {
    setIsConflictDialogOpen(false)
    const remoteContent = persistence.acceptRemote()
    // Goes through handleChange so the local version stays on the undo stack
    if (remoteContent !== null) handleChange(remoteContent)
  }, [persistence, handleChange])

  const handleSaveCopy = useCallback(async () => {
    if (!onSaveCopy) return
    setIsConflictDialogOpen(false)
    if (await onSaveCopy(markdown)) {
      store.clearBackup()
    } else {
      // Copy failed: keep the backup and let the user choose again
      setIsConflictDialogOpen(true)
    }
  }, [onSaveCopy, markdown, store])

  // Navigate to a heading in the document
  const handleHeadingClick = useCallback((headingId: string) => {
    if (!headingId) return

    // Find element by ID and scroll to it
    const element = document.getElementById(headingId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    } else if (markdownInputRef.current) {
      // In edit mode, find the heading line by the same id the outline uses
      const textarea = markdownInputRef.current.getTextarea()
      const heading = extractHeadings(markdown).find((h) => h.id === headingId)
      if (!textarea || !heading) return

      textarea.focus({ preventScroll: true })
      textarea.setSelectionRange(heading.offset, heading.offset)

      // The textarea grows with its content, so scroll the page to the line
      const styles = window.getComputedStyle(textarea)
      const lineHeight =
        parseFloat(styles.lineHeight) || parseFloat(styles.fontSize) * 1.5
      const lineIndex = markdown.substring(0, heading.offset).split("\n").length - 1
      const lineTop =
        textarea.getBoundingClientRect().top +
        parseFloat(styles.paddingTop) +
        lineIndex * lineHeight -
        textarea.scrollTop
      window.scrollBy({ top: lineTop - 100, behavior: "smooth" })
    }
  }, [markdown])

  return (
    <div className={cn(
      "editor-wrapper",
      isFullScreen && "fixed inset-0 z-50 bg-background",
      className
    )}>
      {/* Recovery Banner - hide in distraction-free modes */}
      {showRecoveryBanner && recoveredContent !== null && recoveryTimestamp !== null && !isDistractionFree && (
        <div className="mb-4 rounded-md border border-amber-500 bg-amber-50 p-4 dark:bg-amber-950">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-amber-900 dark:text-amber-100">
                {isCloud ? "Restore unsynced changes?" : "Recover unsaved content?"}
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {isCloud
                  ? "Changes from "
                  : "We found unsaved content from "}
                {getTimeSinceLastSave(recoveryTimestamp)}
                {isCloud
                  ? " were kept on this device but never reached the server. Restoring them replaces the saved version."
                  : ". Would you like to recover it?"}
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
        onNewFile={isCloud ? onNewDocument ?? handleNewFile : handleNewFile}
        onSaveFile={isCloud ? () => void persistence.flush() : handleSaveFile}
        onSaveFileAs={isCloud ? fallbackSaveFile : handleSaveFileAs}
        onOpenFile={handleOpenFile}
        onExportToPDF={handleExportToPDF}
        isFileSystemAPISupported={isFileSystemAPISupported}
        currentFileName={currentFileName}
        isFileSaved={isFileSaved}
        autoSaveEnabled={autoSaveEnabled}
        // Distraction-free mode props
        isDistractionFree={isDistractionFree}
        isFullScreen={isFullScreen}
        onToggleDistractionFree={() => setIsDistractionFree(!isDistractionFree)}
        onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
        // Todo popup props
        onToggleTodo={() => setIsTodoOpen(!isTodoOpen)}
        // Text completion props
        textCompletionEnabled={textCompletionEnabled}
        textCompletionLanguage={textCompletionLanguage}
        textCompletionProfile={textCompletionProfile}
        onToggleTextCompletion={() => setTextCompletionEnabled(!textCompletionEnabled)}
        onChangeTextCompletionLanguage={setTextCompletionLanguage}
        onChangeTextCompletionProfile={setTextCompletionProfile}
        // Cloud document props
        storageKind={store.kind}
        documentTitle={cloudDocument?.title}
        saveStatus={persistence.status}
        lastSavedAt={persistence.lastSavedAt}
        onResolveConflict={() => setIsConflictDialogOpen(true)}
        toolbarEndSlot={toolbarEndSlot}
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
            className="max-sm:hidden" // The sidebar is hidden on mobile
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
              textCompletionEnabled={textCompletionEnabled}
              textCompletionLanguage={textCompletionLanguage}
              textCompletionProfile={textCompletionProfile}
            />
          )}
          {isPreviewMode && (
            useOptimizedPreview ? (
              <OptimizedPreview
                source={markdown}
                debounceMs={350}
                className={cn(
                  "flex-1",
                  !isDistractionFree && "dark:border-gray-700 sm:border-l",
                  isDistractionFree && "prose prose-lg max-w-none p-6"
                )}
              />
            ) : (
              <MarkdownPreview
                source={markdown}
                className={cn(
                  "flex-1",
                  !isDistractionFree && "dark:border-gray-700 sm:border-l",
                  isDistractionFree && "prose prose-lg max-w-none p-6"
                )}
              />
            )
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

      {persistence.conflict && (
        <ConflictDialog
          open={isConflictDialogOpen}
          onOpenChange={setIsConflictDialogOpen}
          localContent={markdown}
          remote={persistence.conflict}
          onKeepMine={handleKeepMine}
          onLoadLatest={handleLoadLatest}
          onSaveCopy={onSaveCopy ? handleSaveCopy : undefined}
        />
      )}

      {/* Todo Popup */}
      <DraggableTodoPopup isOpen={isTodoOpen} onClose={() => setIsTodoOpen(false)} />
    </div>
  )
}
