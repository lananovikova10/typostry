"use client"

import { useState, useRef, useEffect } from "react"

import { cn } from "@/lib/utils"

import { MarkdownInput, MarkdownInputHandle } from "./markdown-input"
import { MarkdownPreview } from "./markdown-preview"
import { MarkdownToolbar } from "./markdown-toolbar"
import { MarkdownSidebar } from "./markdown-sidebar"

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
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null)
  const [isFileSaved, setIsFileSaved] = useState(true)
  const [isFileSystemAPISupported, setIsFileSystemAPISupported] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  
  // Undo history management
  const [undoStack, setUndoStack] = useState<string[]>([initialValue])
  const [redoStack, setRedoStack] = useState<string[]>([])
  const [isUndoRedoOperation, setIsUndoRedoOperation] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const markdownInputRef = useRef<MarkdownInputHandle>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if File System Access API is supported
  useEffect(() => {
    setIsFileSystemAPISupported(
      'showOpenFilePicker' in window && 
      'showSaveFilePicker' in window
    )
  }, [])
  
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

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey
      
      // Global shortcut to focus textarea: 'i'
      if (event.key === 'i' && !isCtrlOrCmd && !event.altKey && !event.shiftKey) {
        // Only activate if not already in a text input
        const activeElement = document.activeElement
        const isInputActive = activeElement instanceof HTMLInputElement || 
                              activeElement instanceof HTMLTextAreaElement
        
        if (!isInputActive && !isPreviewMode) {
          event.preventDefault()
          markdownInputRef.current?.focus()
        }
      }

      // Toggle view mode: 'ESC'
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsPreviewMode(!isPreviewMode)
      }

      // Only process these shortcuts if editor element has focus
      const editorHasFocus = editorRef.current?.contains(document.activeElement) || false
      if (!editorHasFocus) return

      if (isCtrlOrCmd) {
        switch (event.key) {
          case 's': // Format/Save: 'CTRL/CMD + S'
            event.preventDefault()
            handleSaveFile()
            break
          
          case '[': // Anchor: 'CTRL/CMD + ['
            event.preventDefault()
            if (!isPreviewMode) {
              handleInsertAction("[Link text](https://example.com)")
            }
            break
          
          case ']': // Image: 'CTRL/CMD + ]'
            event.preventDefault()
            if (!isPreviewMode) {
              handleInsertAction("![Image alt text](https://example.com/image.jpg)")
            }
            break
          
          case '\\': // Table: 'CTRL/CMD + \'
            event.preventDefault()
            if (!isPreviewMode) {
              handleInsertAction("\n| Header 1 | Header 2 | Header 3 |\n| -------- | -------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n")
            }
            break
          
          case 'z': // Undo: 'CTRL/CMD + Z'
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
            
          case 'y': // Redo: 'CTRL/CMD + Y' (alternative to CTRL/CMD + Shift + Z)
            event.preventDefault()
            if (!isPreviewMode) {
              handleRedo()
            }
            break
        }
      }
    }

    // Add event listener to window
    window.addEventListener('keydown', handleKeyDown)
    
    // Cleanup function
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isPreviewMode, markdown, undoStack, redoStack]) // Re-register when relevant state changes

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
    setMarkdown(previousState || '')
    onChange?.(previousState || '')
    
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
  
  const handleInsertAction = (text: string) => {
    const textarea = markdownInputRef.current?.getTextarea()
    
    if (!textarea) {
      // Fallback if textarea reference is not available
      handleChange(markdown + text)
      return
    }
    
    const { selectionStart, selectionEnd } = textarea
    const selectedText = markdown.substring(selectionStart, selectionEnd)
    const beforeSelection = markdown.substring(0, selectionStart)
    const afterSelection = markdown.substring(selectionEnd)
    
    let newValue = ''
    let newCursorPosition = 0
    
    // Check if there's selected text to wrap
    if (selectedText) {
      if (text.includes("**Bold text**")) {
        newValue = beforeSelection + "**" + selectedText + "**" + afterSelection
        newCursorPosition = selectionStart + 2 + selectedText.length + 2
      } else if (text.includes("*Italic text*")) {
        newValue = beforeSelection + "*" + selectedText + "*" + afterSelection
        newCursorPosition = selectionStart + 1 + selectedText.length + 1
      } else if (text.includes("[Link text]")) {
        newValue = beforeSelection + "[" + selectedText + "](https://example.com)" + afterSelection
        newCursorPosition = selectionStart + 1 + selectedText.length + 1
      } else if (text.includes("![Image alt text]")) {
        newValue = beforeSelection + "![" + selectedText + "](https://example.com/image.jpg)" + afterSelection
        newCursorPosition = selectionStart + 2 + selectedText.length + 1
      } else if (text.includes("\n# Heading 1\n")) {
        // Special handling for headings with selection
        newValue = beforeSelection + "# " + selectedText + afterSelection
        newCursorPosition = selectionStart + 2 + selectedText.length
      } else if (text.includes("\n## Heading 2\n")) {
        // Special handling for headings with selection
        newValue = beforeSelection + "## " + selectedText + afterSelection
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
    
    // After React re-renders, set the cursor position
    setTimeout(() => {
      const textareaElement = markdownInputRef.current?.getTextarea()
      if (textareaElement) {
        textareaElement.focus()
        textareaElement.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }

  const handleNewFile = async () => {
    if (!isFileSaved && 
        !window.confirm("Are you sure you want to create a new file? Any unsaved changes will be lost.")) {
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
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
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
        if ((error as Error).name !== 'AbortError') {
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
      element.scrollIntoView({ behavior: 'smooth' })
    } else if (markdownInputRef.current) {
      // In edit mode, we need to find the heading position in the text
      const textarea = markdownInputRef.current.getTextarea()
      if (!textarea) return

      // Search for the heading in the markdown text
      const headingText = headingId
        .replace(/-/g, ' ') // Convert hyphens back to spaces
        .replace(/\b\w/g, (c) => c.toUpperCase()) // Capitalize first letter of each word
      
      // Search for the heading pattern in markdown
      const regex = new RegExp(`^(#+)\\s+${headingText}`, 'mi')
      const match = regex.exec(markdown)
      
      if (match && textarea) {
        const index = match.index
        textarea.focus()
        textarea.setSelectionRange(index, index)
        
        // Calculate position to scroll
        const lines = markdown.substring(0, index).split('\n')
        const lineHeight = 20 // Approximate line height in pixels
        const scrollPosition = lines.length * lineHeight
        
        textarea.scrollTop = scrollPosition - 100 // Scroll a bit above the heading
      }
    }
  }

  return (
    <div
      ref={editorRef}
      className={cn(
        "flex min-h-[300px] w-full flex-col rounded-md border border-input bg-background shadow-sm hover:shadow-md transition-shadow duration-200",
        className
      )}
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
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={sidebarEnabled ? () => setIsSidebarCollapsed(!isSidebarCollapsed) : undefined}
      />

      <div className="relative flex flex-1 flex-col md:flex-row">
        {/* Sidebar */}
        {sidebarEnabled && (
          <MarkdownSidebar
            content={markdown}
            onHeadingClick={handleHeadingClick}
            isCollapsed={isSidebarCollapsed}
            className="hidden md:block" // Hide on mobile
          />
        )}
        
        {/* Editor or Preview */}
        <div className={cn("flex-1 flex", !isPreviewMode && "flex-col")}>
          {!isPreviewMode && (
            <MarkdownInput
              value={markdown}
              onChange={handleChange}
              className="flex-1 p-2"
              ref={markdownInputRef}
            />
          )}
          {isPreviewMode && (
            <MarkdownPreview source={markdown} className="flex-1 border-l dark:border-gray-700" />
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
  )
}
