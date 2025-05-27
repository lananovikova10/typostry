"use client"

import React, { useEffect, useRef, useState } from "react"
import { ExternalLink, FileText, RefreshCw, Search, X } from "lucide-react"

import {
  fetchTemplateContent,
  fetchTemplateFiles,
  formatTemplateName,
  getTemplatePreview,
} from "@/lib/gitlab"
import { TemplateFile } from "@/lib/gitlab/schema"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

interface TemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (content: string) => void
}

export function TemplateModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplateModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<TemplateFile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateFile | null>(
    null
  )
  const [templateContent, setTemplateContent] = useState<string>("")
  const [templatePreview, setTemplatePreview] = useState<string>("")
  const [loadingContent, setLoadingContent] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Fetch template files when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
      // Focus search input when modal opens
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus()
        }
      }, 100)
    }
  }, [isOpen])

  // Fetch template list from GitLab API
  const fetchTemplates = async () => {
    setLoading(true)
    setError(null)
    try {
      const files = await fetchTemplateFiles()

      // Sort templates alphabetically by name
      const sortedFiles = [...files].sort((a, b) => {
        const nameA = formatTemplateName(a.name)
        const nameB = formatTemplateName(b.name)
        return nameA.localeCompare(nameB)
      })
      setTemplates(sortedFiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch templates")
    } finally {
      setLoading(false)
    }
  }

  // Fetch template content
  const fetchContent = async (template: TemplateFile) => {
    setSelectedTemplate(template)
    setLoadingContent(true)
    setError(null)
    try {
      const content = await fetchTemplateContent(template.path)
      setTemplateContent(content)
      setTemplatePreview(getTemplatePreview(content, 5))
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch template content"
      )
    } finally {
      setLoadingContent(false)
    }
  }

  // Handle template selection
  const handleSelectTemplate = () => {
    if (templateContent) {
      onSelectTemplate(templateContent)
      onClose()
    }
  }

  // Filter templates based on search query
  const filteredTemplates = templates.filter((template) => {
    const displayName = formatTemplateName(template.name)
    return displayName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Reset state
  const handleClose = () => {
    setSelectedTemplate(null)
    setTemplateContent("")
    setTemplatePreview("")
    setSearchQuery("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl overflow-hidden sm:max-h-[90vh]">
        <DialogHeader>
          <DialogTitle id="template-dialog-title">GitLab Templates</DialogTitle>
          <DialogDescription id="template-dialog-description">
            Select a template from GitLab to insert into your document.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
            <div className="flex">
              <div className="text-sm text-red-700 dark:text-red-200">
                <p>{error}</p>
                <Button
                  variant="link"
                  className="mt-2 h-auto p-0 text-red-700 dark:text-red-200"
                  onClick={fetchTemplates}
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  Try again
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          {/* Template list column */}
          <div className="flex-1">
            <div className="mb-4 flex items-center rounded-md border">
              <Search className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search templates..."
                className="border-0 focus-visible:ring-0 focus-visible:ring-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search templates"
              />
            </div>

            <div
              className="h-[300px] overflow-y-auto rounded-md border p-1"
              role="listbox"
              aria-label="Template list"
              data-testid="template-list"
            >
              {loading ? (
                <div
                  className="flex h-full items-center justify-center"
                  data-testid="loading-indicator"
                >
                  <div className="flex items-center text-sm text-muted-foreground">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Loading templates...
                  </div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div
                  className="flex h-full items-center justify-center text-sm text-muted-foreground"
                  data-testid="empty-state"
                >
                  {searchQuery
                    ? "No templates match your search"
                    : "No templates available"}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`cursor-pointer rounded-md p-2 text-sm transition-colors hover:bg-accent ${
                        selectedTemplate?.id === template.id ? "bg-accent" : ""
                      }`}
                      onClick={() => fetchContent(template)}
                      role="option"
                      aria-selected={selectedTemplate?.id === template.id}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          fetchContent(template)
                        }
                      }}
                      data-testid={`template-item-${template.id}`}
                    >
                      <div className="flex items-center">
                        <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{formatTemplateName(template.name)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Preview column */}
          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium">Preview</h3>
              {selectedTemplate && (
                <a
                  href={`https://gitlab.com/tgdp/templates/-/blob/v1.3.0/${selectedTemplate.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  View on GitLab
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              )}
            </div>
            <div
              className="h-[300px] overflow-y-auto rounded-md border p-4"
              data-testid="template-preview"
            >
              {loadingContent ? (
                <div
                  className="flex h-full items-center justify-center"
                  data-testid="preview-loading"
                >
                  <div className="flex items-center text-sm text-muted-foreground">
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Loading preview...
                  </div>
                </div>
              ) : selectedTemplate ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap break-words font-mono text-xs">
                    {templatePreview}
                  </pre>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Select a template to preview
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="text-xs text-muted-foreground">
            Templates provided by{" "}
            <a
              href="https://gitlab.com/tgdp/templates"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              The Good Docs Project
            </a>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleClose}
              data-testid="cancel-button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSelectTemplate}
              disabled={!templateContent || loadingContent}
              data-testid="insert-button"
            >
              Insert Template
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
