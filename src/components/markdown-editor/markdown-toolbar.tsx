"use client"

import React from "react"
import {
  Bold,
  Code,
  Eye,
  FileCode,
  FileText,
  FolderOpen,
  Heading1,
  Heading2,
  Image as ImageIcon,
  ImagePlus,
  Italic,
  Link,
  List,
  ListOrdered,
  Maximize,
  Minimize,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  PenLine,
  Quote,
  Save,
  SaveAll,
  Smile,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { getRandomPhotoAsMarkdown } from "@/lib/unsplash"
import { Button } from "@/components/ui/button"
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerFooter,
  EmojiPickerSearch,
} from "@/components/ui/emoji-picker"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { TemplateSelector } from "@/components/ui/template-selector"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TableGenerator } from "@/components/markdown-editor/table-generator"
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
  // Distraction-free mode props
  isDistractionFree?: boolean
  isFullScreen?: boolean
  onToggleDistractionFree?: () => void
  onToggleFullScreen?: () => void
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
  // Distraction-free mode props
  isDistractionFree = false,
  isFullScreen = false,
  onToggleDistractionFree,
  onToggleFullScreen,
}: MarkdownToolbarProps) {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = React.useState(false)
  const [isTemplateSelectorOpen, setIsTemplateSelectorOpen] =
    React.useState(false)

  // Handle emoji selection from the emoji picker
  const handleEmojiSelect = (emoji: any) => {
    console.log("Selected emoji:", emoji)

    // Insert the actual emoji character directly instead of creating shortcodes
    // This ensures compatibility regardless of whether the shortcode exists in our mapping
    onInsertAction(emoji.emoji || "😀")

    // Close the picker after a small delay to allow focus restoration to complete
    setTimeout(() => {
      setIsEmojiPickerOpen(false)
    }, 10)
  }

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
            const clipboardText = await navigator.clipboard.readText()

            // Simple URL validation regex
            const urlRegex = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i

            if (urlRegex.test(clipboardText)) {
              // Get the selected text from the textarea
              const textarea = document.querySelector(
                'textarea[data-testid="markdown-input"]'
              ) as HTMLTextAreaElement
              if (!textarea) {
                onInsertAction("[Link](" + clipboardText + ")")
                return
              }

              const selectedText = textarea.value.substring(
                textarea.selectionStart,
                textarea.selectionEnd
              )

              // If there's selected text, wrap it with the link format
              if (selectedText) {
                const beforeSelection = textarea.value.substring(
                  0,
                  textarea.selectionStart
                )
                const afterSelection = textarea.value.substring(
                  textarea.selectionEnd
                )
                const newValue =
                  beforeSelection +
                  "[" +
                  selectedText +
                  "](" +
                  clipboardText +
                  ")" +
                  afterSelection

                // Update the textarea value
                textarea.value = newValue

                // Trigger the onChange event
                const event = new Event("input", { bubbles: true })
                textarea.dispatchEvent(event)

                // Set cursor position after the inserted link
                setTimeout(() => {
                  const newCursorPosition =
                    textarea.selectionStart +
                    selectedText.length +
                    clipboardText.length +
                    4
                  textarea.setSelectionRange(
                    newCursorPosition,
                    newCursorPosition
                  )
                  textarea.focus()
                }, 0)
              } else {
                // No selection, just insert the link
                onInsertAction("[Link](" + clipboardText + ")")
              }
            } else {
              // Not a URL, insert default link format
              onInsertAction("[Link text](https://example.com)")
            }
          } catch (error) {
            console.error("Failed to read clipboard:", error)
            // Fallback to default behavior
            onInsertAction("[Link text](https://example.com)")
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
      {
        name: "Unsplash Image",
        icon: <ImagePlus className="h-4 w-4" />,
        action: async () => {
          try {
            // Get the textarea element
            const textarea = document.querySelector(
              'textarea[data-testid="markdown-input"]'
            ) as HTMLTextAreaElement

            // Fetch random photo from Unsplash
            const markdownText = await getRandomPhotoAsMarkdown()

            // Insert the Unsplash image markdown directly using the onInsertAction callback
            // This ensures React state is updated properly
            onInsertAction(markdownText)

            // Set cursor position after the inserted text if textarea is available
            if (textarea) {
              setTimeout(() => {
                const newCursorPosition = textarea.selectionStart
                textarea.setSelectionRange(newCursorPosition, newCursorPosition)
                textarea.focus()
              }, 0)
            }
          } catch (error) {
            console.error("Failed to fetch Unsplash image:", error)

            // Show error message in an alert
            alert(
              "Failed to fetch image from Unsplash. Please try again later."
            )
          }
        },
        ariaLabel: "Insert random Unsplash image",
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
      {
        name: "Emoji",
        icon: <Smile className="h-4 w-4" />,
        action: () => setIsEmojiPickerOpen(true),
        ariaLabel: "Insert emoji",
        isPopover: true,
      },
      {
        name: "Table",
        isCustomComponent: true,
        ariaLabel: "Insert table",
      },
      {
        name: "Templates",
        icon: <FileCode className="h-4 w-4" />,
        action: () => setIsTemplateSelectorOpen(true),
        ariaLabel: "Insert template",
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
      tooltip:
        isFileSystemAPISupported && currentFileName
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

  // Distraction-free mode controls
  const distractionFreeControls = [
    {
      name: "Distraction Free",
      icon: isDistractionFree ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />,
      action: onToggleDistractionFree,
      ariaLabel: isDistractionFree ? "Exit distraction-free mode" : "Enter distraction-free mode",
      tooltip: isDistractionFree ? "Exit Distraction Free" : "Distraction Free Mode",
      active: isDistractionFree,
    },
    {
      name: "Full Screen",
      icon: isFullScreen ? <Monitor className="h-4 w-4" /> : <Maximize className="h-4 w-4" />,
      action: onToggleFullScreen,
      ariaLabel: isFullScreen ? "Exit full screen" : "Enter full screen",
      tooltip: isFullScreen ? "Exit Full Screen" : "Full Screen",
      active: isFullScreen,
    },
  ].filter(control => control.action) // Only include controls that have handlers

  return (
    <div className={cn(
      "relative w-full bg-background transition-all duration-300",
      !isDistractionFree && "border-b shadow-sm",
      isDistractionFree && "absolute top-0 left-0 right-0 z-50 opacity-0 hover:opacity-100 bg-background/95 backdrop-blur-sm border-b border-border/50",
      // On mobile, show with reduced opacity for accessibility
      isDistractionFree && "sm:opacity-0 sm:hover:opacity-100 opacity-40 hover:opacity-100 active:opacity-100"
    )}>
      {/* Main toolbar container - horizontal scrollable layout */}
      <div className="flex items-center gap-2 p-2 min-h-[3rem] overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/30 hover:scrollbar-thumb-border/50">

        {/* Complete toolbar with all tools - shows based on mode */}
        <div className="flex items-center gap-1 flex-nowrap min-w-max">

          {/* File operations group */}
          {!isDistractionFree && (
            <>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  {fileOperations.map((item) => (
                    <Tooltip key={item.name}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={item.action}
                          aria-label={item.ariaLabel}
                          className="h-8 w-8 flex-shrink-0 text-[hsl(var(--markdown-toolbar-icon))] hover:bg-secondary/70 hover:text-[hsl(var(--markdown-toolbar-icon-hover))]"
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
              <Separator orientation="vertical" className="mx-1 h-8 flex-shrink-0" />
            </>
          )}

          {/* Formatting tools group - show all in normal mode, hide in distraction-free */}
          {!isDistractionFree && (
            <div className="flex items-center gap-1">
              <TooltipProvider>
                {toolbarGroups.map((group, groupIndex) => (
                  <React.Fragment key={`group-${groupIndex}`}>
                    {groupIndex > 0 && (
                      <Separator orientation="vertical" className="mx-1 h-8 flex-shrink-0" />
                    )}
                    {group.map((item) => (
                      <React.Fragment key={item.name}>
                        {item.isPopover ? (
                          <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={item.ariaLabel}
                                    disabled={isPreviewMode}
                                    className="h-8 w-8 flex-shrink-0 text-[hsl(var(--markdown-toolbar-icon))] hover:bg-secondary/70 hover:text-[hsl(var(--markdown-toolbar-icon-hover))]"
                                    data-testid={`toolbar-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                                  >
                                    {item.icon}
                                  </Button>
                                </PopoverTrigger>
                              </TooltipTrigger>
                              <TooltipContent><p>{item.name}</p></TooltipContent>
                            </Tooltip>
                            <PopoverContent className="w-80 p-0" align="start">
                              <EmojiPicker onEmojiSelect={handleEmojiSelect}>
                                <EmojiPickerSearch placeholder="Search emojis..." />
                                <EmojiPickerContent />
                                <EmojiPickerFooter />
                              </EmojiPicker>
                            </PopoverContent>
                          </Popover>
                        ) : item.isCustomComponent && item.name === "Table" ? (
                          <TableGenerator onInsertTable={onInsertAction} isDisabled={isPreviewMode} />
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={item.action}
                                aria-label={item.ariaLabel}
                                disabled={isPreviewMode}
                                className="h-8 w-8 flex-shrink-0 text-[hsl(var(--markdown-toolbar-icon))] hover:bg-secondary/70 hover:text-[hsl(var(--markdown-toolbar-icon-hover))]"
                                data-testid={`toolbar-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                              >
                                {item.icon}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>{item.name}</p></TooltipContent>
                          </Tooltip>
                        )}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </TooltipProvider>
            </div>
          )}

          {/* Separator before distraction-free controls */}
          <Separator orientation="vertical" className="mx-1 h-8 flex-shrink-0" />

          {/* Distraction-free controls group */}
          <div className="flex items-center gap-1">
            {distractionFreeControls.length > 0 && (
              <TooltipProvider>
                {distractionFreeControls.map((control) => (
                  <Tooltip key={control.name}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={control.active ? "default" : "ghost"}
                        size="icon"
                        onClick={control.action}
                        aria-label={control.ariaLabel}
                        className={cn(
                          "h-8 w-8 flex-shrink-0",
                          control.active
                            ? "bg-primary text-primary-foreground"
                            : "text-[hsl(var(--markdown-toolbar-icon))] hover:bg-secondary/70"
                        )}
                        data-testid={`distraction-${control.name.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {control.icon}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{control.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            )}
          </div>

          {/* Separator before view controls */}
          <Separator orientation="vertical" className="mx-1 h-8 flex-shrink-0" />

          {/* View controls group */}
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onTogglePreview}
                    aria-label={isPreviewMode ? "Edit mode" : "Preview mode"}
                    className="h-8 w-8 flex-shrink-0 text-[hsl(var(--markdown-toolbar-icon))] hover:bg-secondary/70"
                    data-testid="toggle-preview"
                  >
                    {isPreviewMode ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isPreviewMode ? "Edit Mode" : "Preview Mode"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <ModeToggle />
          </div>

          {/* Filename display - only on wide screens in normal mode */}
          {currentFileName && !isDistractionFree && (
            <>
              <Separator orientation="vertical" className="mx-1 h-8 flex-shrink-0" />
              <div className="hidden lg:flex items-center text-sm font-medium px-2">
                <span className="truncate" title={currentFileName}>
                  {currentFileName}
                  {!isFileSaved ? " *" : ""}
                </span>
                {autoSaveEnabled && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="ml-2 flex items-center" aria-label="Auto-save enabled">
                          <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Auto-save enabled</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={isTemplateSelectorOpen}
        onClose={() => setIsTemplateSelectorOpen(false)}
        onSelectTemplate={onInsertAction}
      />
    </div>
  )
}
