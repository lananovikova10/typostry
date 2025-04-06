"use client"

import React from "react"
import {
  Bold,
  Code,
  Eye,
  FileText,
  FolderOpen,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link,
  List,
  ListOrdered,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Pencil,
  Quote,
  Save,
  SaveAll,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ModeToggle } from "@/components/mode-toggle"

export interface MarkdownToolbarProps {
  isPreviewMode: boolean
  onTogglePreview: () => void
  onInsertAction: (text: string) => void
  onNewFile: () => void
  onSaveFile: () => void
  onSaveFileAs?: () => void
  onOpenFile: () => void
  isFileSystemAPISupported?: boolean
  currentFileName?: string | null
  isFileSaved?: boolean
  autoSaveEnabled?: boolean
  isSidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

export function MarkdownToolbar({
  isPreviewMode,
  onTogglePreview,
  onInsertAction,
  onNewFile,
  onSaveFile,
  onSaveFileAs,
  onOpenFile,
  isFileSystemAPISupported = false,
  currentFileName = null,
  isFileSaved = true,
  autoSaveEnabled = false,
  isSidebarCollapsed = false,
  onToggleSidebar,
}: MarkdownToolbarProps) {
  // Organize toolbar items into logical groups
  const toolbarGroups = [
    // Text formatting group
    [
      {
        name: "Bold",
        icon: <Bold className="h-4 w-4" />,
        action: () => onInsertAction("**Bold text**"),
        ariaLabel: "Insert bold text",
      },
      {
        name: "Italic",
        icon: <Italic className="h-4 w-4" />,
        action: () => onInsertAction("*Italic text*"),
        ariaLabel: "Insert italic text",
      },
    ],
    // Headings group
    [
      {
        name: "Heading 1",
        icon: <Heading1 className="h-4 w-4" />,
        action: () => onInsertAction("# Heading 1"),
        ariaLabel: "Insert heading 1",
      },
      {
        name: "Heading 2",
        icon: <Heading2 className="h-4 w-4" />,
        action: () => onInsertAction("## Heading 2"),
        ariaLabel: "Insert heading 2",
      },
    ],
    // Content elements group
    [
      {
        name: "Link",
        icon: <Link className="h-4 w-4" />,
        action: async () => {
          try {
            // Read from clipboard
            const clipboardText = await navigator.clipboard.readText();

            // Simple URL validation regex
            const urlRegex = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i;

            if (urlRegex.test(clipboardText)) {
              // Get the selected text from the textarea
              const textarea = document.querySelector('textarea[data-testid="markdown-input"]') as HTMLTextAreaElement;
              if (!textarea) {
                onInsertAction("[Link](" + clipboardText + ")");
                return;
              }

              const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);

              // If there's selected text, wrap it with the link format
              if (selectedText) {
                const beforeSelection = textarea.value.substring(0, textarea.selectionStart);
                const afterSelection = textarea.value.substring(textarea.selectionEnd);
                const newValue = beforeSelection + '[' + selectedText + '](' + clipboardText + ')' + afterSelection;

                // Update the textarea value
                textarea.value = newValue;

                // Trigger the onChange event
                const event = new Event('input', { bubbles: true });
                textarea.dispatchEvent(event);

                // Set cursor position after the inserted link
                setTimeout(() => {
                  const newCursorPosition = textarea.selectionStart + selectedText.length + clipboardText.length + 4;
                  textarea.setSelectionRange(newCursorPosition, newCursorPosition);
                  textarea.focus();
                }, 0);
              } else {
                // No selection, just insert the link
                onInsertAction("[Link](" + clipboardText + ")");
              }
            } else {
              // Not a URL, insert default link format
              onInsertAction("[Link text](https://example.com)");
            }
          } catch (error) {
            console.error("Failed to read clipboard:", error);
            // Fallback to default behavior
            onInsertAction("[Link text](https://example.com)");
          }
        },
        ariaLabel: "Insert link",
      },
      {
        name: "Image",
        icon: <ImageIcon className="h-4 w-4" />,
        action: () =>
          onInsertAction("![Image alt text](https://example.com/image.jpg)"),
        ariaLabel: "Insert image",
      },
    ],
    // Lists group
    [
      {
        name: "Bulleted List",
        icon: <List className="h-4 w-4" />,
        action: () =>
          onInsertAction("\n- List item 1\n- List item 2\n- List item 3\n"),
        ariaLabel: "Insert bulleted list",
      },
      {
        name: "Numbered List",
        icon: <ListOrdered className="h-4 w-4" />,
        action: () =>
          onInsertAction("\n1. List item 1\n2. List item 2\n3. List item 3\n"),
        ariaLabel: "Insert numbered list",
      },
    ],
    // Other formatting group
    [
      {
        name: "Code",
        icon: <Code className="h-4 w-4" />,
        action: () =>
          onInsertAction("\n```\nconst example = 'code block';\n```\n"),
        ariaLabel: "Insert code block",
      },
      {
        name: "Quote",
        icon: <Quote className="h-4 w-4" />,
        action: () => onInsertAction("\n> Blockquote text\n"),
        ariaLabel: "Insert blockquote",
      },
    ],
  ]

  // Flatten for any existing code that expects a flat array
  const toolbarItems = toolbarGroups.flat()

  // Basic file operations always available
  const fileOperations = [
    {
      name: "New",
      icon: <FileText className="h-4 w-4" />,
      action: onNewFile,
      ariaLabel: "Create a new file",
      tooltip: "New File",
    },
    {
      name: "Open",
      icon: <FolderOpen className="h-4 w-4" />,
      action: onOpenFile,
      ariaLabel: "Open an existing file",
      tooltip: isFileSystemAPISupported 
        ? "Open a file from your local file system" 
        : "Open a file",
    },
    {
      name: "Save",
      icon: <Save className="h-4 w-4" />,
      action: onSaveFile,
      ariaLabel: "Save current file",
      tooltip: isFileSystemAPISupported && currentFileName 
        ? `Save to ${currentFileName}${!isFileSaved ? " *" : ""}` 
        : "Save file",
    },
  ]

  // Add Save As option when File System API is supported
  if (isFileSystemAPISupported && onSaveFileAs) {
    fileOperations.push({
      name: "SaveAs",
      icon: <SaveAll className="h-4 w-4" />,
      action: onSaveFileAs,
      ariaLabel: "Save file as",
      tooltip: "Save As",
    })
  }

  return (
    <div className="flex items-center border-b p-2 shadow-sm overflow-hidden whitespace-nowrap">
      {/* Left side: File operations and formatting tools */}
      <div className="flex items-center gap-1 flex-shrink-0 min-w-0 flex-nowrap">
        <div className="flex items-center gap-1 mr-1 flex-nowrap">
          <TooltipProvider>
            {fileOperations.map((item) => (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={item.action}
                    aria-label={item.ariaLabel}
                    className="h-8 w-8 flex-shrink-0 text-[hsl(var(--markdown-toolbar-icon))] hover:text-[hsl(var(--markdown-toolbar-icon-hover))] hover:bg-secondary/70"
                    data-testid={`file-${item.name.toLowerCase()}`}
                  >
                    {item.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
        <Separator orientation="vertical" className="h-8 mx-1 flex-shrink-0" />
        <TooltipProvider>
          {toolbarGroups.map((group, groupIndex) => (
            <React.Fragment key={`group-${groupIndex}`}>
              {groupIndex > 0 && (
                <Separator orientation="vertical" className="h-8 mx-1 flex-shrink-0" />
              )}
              {group.map((item) => (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={item.action}
                      aria-label={item.ariaLabel}
                      disabled={isPreviewMode}
                      className="h-8 w-8 flex-shrink-0 text-[hsl(var(--markdown-toolbar-icon))] hover:text-[hsl(var(--markdown-toolbar-icon-hover))] hover:bg-secondary/70 focus-visible:ring-2 focus-visible:ring-[hsl(var(--markdown-toolbar-active))]"
                      data-testid={`toolbar-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {item.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </React.Fragment>
          ))}
        </TooltipProvider>
      </div>

      {/* Center: Filename with autosave indicator */}
      {currentFileName && (
        <div className="flex items-center mx-4 text-sm font-medium overflow-hidden flex-shrink min-w-0 max-w-[40%]">
          <span className="truncate" title={currentFileName}>
            {currentFileName}{!isFileSaved ? " *" : ""}
          </span>
          {autoSaveEnabled && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="ml-1 w-3 h-3 rounded-full bg-green-500 flex-shrink-0" aria-label="Auto-save enabled"></div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Auto-save enabled</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}

      {/* Right side: View controls */}
      <div className="flex items-center ml-auto gap-2 flex-shrink-0 flex-nowrap">
        {onToggleSidebar && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleSidebar}
                  aria-label={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
                  className="h-8 w-8 text-[hsl(var(--markdown-toolbar-icon))] hover:text-[hsl(var(--markdown-toolbar-icon-hover))] hover:bg-secondary/70"
                  data-testid="toggle-sidebar"
                >
                  {isSidebarCollapsed ? (
                    <PanelLeftOpen className="h-4 w-4" />
                  ) : (
                    <PanelLeftClose className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isSidebarCollapsed ? "Show document outline" : "Hide document outline"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onTogglePreview}
          aria-label={isPreviewMode ? "Edit mode" : "Preview mode"}
          className="text-[hsl(var(--markdown-toolbar-icon))] hover:text-[hsl(var(--markdown-toolbar-icon-hover))] border border-transparent hover:border-secondary focus-visible:ring-2 focus-visible:ring-[hsl(var(--markdown-toolbar-active))]"
          data-testid="toggle-preview"
        >
          {isPreviewMode ? (
            <>
              <Pencil className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </>
          )}
        </Button>
        <ModeToggle />
      </div>
    </div>
  )
}
