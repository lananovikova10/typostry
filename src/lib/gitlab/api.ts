/**
 * GitLab API service for fetching templates from The Good Docs Project
 */

import { GitLabTreeResponse, TemplateContent, TemplateFile, gitLabTreeResponseSchema } from './schema'

// Cache for storing fetched templates to avoid repeated API calls
const templateCache = new Map<string, TemplateFile[]>()
const contentCache = new Map<string, string>()

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cacheWithTimestamp = new Map<string, CacheEntry<any>>()

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION
}

function getCachedData<T>(key: string): T | null {
  const entry = cacheWithTimestamp.get(key)
  if (entry && isCacheValid(entry.timestamp)) {
    return entry.data
  }
  cacheWithTimestamp.delete(key)
  return null
}

function setCachedData<T>(key: string, data: T): void {
  cacheWithTimestamp.set(key, {
    data,
    timestamp: Date.now()
  })
}

/**
 * Formats template filename for display
 * Converts "template_api-reference.md" to "Api Reference"
 */
export const formatTemplateName = (filename: string): string => {
  return filename
    .replace("template_", "")
    .replace(".md", "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Gets a preview of template content (first few lines)
 */
export const getTemplatePreview = (content: string, lines = 3): string => {
  return content.split("\n").slice(0, lines).join("\n")
}

/**
 * Fetches the list of template files from GitLab using absolute URL
 */
export const fetchTemplateFiles = async (): Promise<TemplateFile[]> => {
  const cacheKey = 'template-files'

  // Check cache first
  const cachedData = getCachedData<TemplateFile[]>(cacheKey)
  if (cachedData) {
    return cachedData
  }

  try {
    // Use absolute GitLab API URL with pagination to get all files
    const url = 'https://gitlab.com/api/v4/projects/tgdp%2Ftemplates/repository/tree?ref=v1.3.0&recursive=true&per_page=1000'

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`)
    }      const rawData = await response.json()
      
      // Validate response with Zod schema
      const validatedData = gitLabTreeResponseSchema.parse(rawData)

      // Filter for template files matching pattern: {folder}/template_{name}.md
      const templates: TemplateFile[] = validatedData
        .filter((item) =>
          item.type === "blob" &&
          item.path.match(/^[^/]+\/template_[^/]+\.md$/)
        )
        .map((item) => ({
          id: item.id,
          name: item.name,
          path: item.path,
          type: item.type,
          mode: item.mode,
        }))

    // Cache the results
    setCachedData(cacheKey, templates)

    return templates
  } catch (error) {
    console.error("Error fetching template files:", error)
    throw error
  }
}

/**
 * Fetches the content of a specific template file from GitLab using absolute URL
 */
export const fetchTemplateContent = async (filePath: string): Promise<string> => {
  const cacheKey = `template-content-${filePath}`

  // Check cache first
  const cachedContent = getCachedData<string>(cacheKey)
  if (cachedContent) {
    return cachedContent
  }

  try {
    // Use absolute GitLab API URL for raw file content
    const encodedPath = encodeURIComponent(filePath)
    const url = `https://gitlab.com/api/v4/projects/tgdp%2Ftemplates/repository/files/${encodedPath}/raw?ref=v1.3.0`

    const response = await fetch(url, {
      headers: {
        'Accept': 'text/plain',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch template content: ${response.statusText}`)
    }

    const content = await response.text()

    // Cache the content
    setCachedData(cacheKey, content)

    return content
  } catch (error) {
    console.error("Error fetching template content:", error)
    throw error
  }
}