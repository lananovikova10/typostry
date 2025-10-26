"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { codeToHtml } from "shiki"

import { replaceEmojis } from "@/lib/emoji"
import { cn } from "@/lib/utils"
import { useMarkdownWorker } from "@/hooks/useMarkdownWorker"

const isBrowser = typeof window !== "undefined"

export interface OptimizedPreviewProps {
  source: string
  className?: string
  useVirtualScrolling?: boolean
  debounceMs?: number
}

/**
 * Optimized markdown preview with:
 * - Debounced rendering
 * - Web Worker for heavy processing
 * - Lazy code highlighting
 * - Memoized rendering
 */
export function OptimizedPreview({
  source,
  className,
  useVirtualScrolling = false,
  debounceMs = 300,
}: OptimizedPreviewProps) {
  const [mermaidInstance, setMermaidInstance] = useState<any>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const { theme, resolvedTheme } = useTheme()
  const { html, isProcessing, error, processMarkdown } = useMarkdownWorker()

  // Process markdown with debouncing and worker
  useEffect(() => {
    if (!isBrowser) return

    // Replace emoji shortcodes first
    const processedSource = replaceEmojis(source)

    // Process in worker with debouncing
    processMarkdown(processedSource, debounceMs)
  }, [source, debounceMs, processMarkdown])

  // Initialize mermaid
  useEffect(() => {
    if (!isBrowser) return

    const initMermaid = async () => {
      try {
        const mermaidModule = await import("mermaid")
        const mermaid = mermaidModule.default

        mermaid.initialize({
          startOnLoad: false,
          theme: resolvedTheme === "dark" ? "dark" : "default",
          securityLevel: "loose",
          fontFamily: "inherit",
        })

        setMermaidInstance(mermaid)
      } catch (error) {
        console.error("Failed to initialize mermaid:", error)
      }
    }

    initMermaid()
  }, [resolvedTheme])

  // Render Mermaid diagrams
  const renderMermaidDiagram = useCallback(
    async (code: string, codeBlock: Element) => {
      console.log('🎭 [OptimizedPreview] renderMermaidDiagram called')
      console.log('  - Code:', code.substring(0, 50) + '...')
      console.log('  - mermaidInstance:', !!mermaidInstance)

      if (!isBrowser) {
        console.log('  ⚠️ Not in browser, skipping')
        return
      }

      if (!mermaidInstance) {
        console.log('  ⚠️ Mermaid not initialized, skipping')
        return
      }

      const pre = codeBlock.parentElement
      console.log('  - Parent element:', pre?.tagName)

      if (!pre) {
        console.error('  ❌ No parent element found!')
        return
      }

      const diagramId = `mermaid-diagram-${Math.random().toString(36).substring(2, 11)}`
      const container = document.createElement("div")
      container.id = diagramId
      container.className = "mermaid-diagram"
      container.style.width = "100%"
      container.style.overflow = "auto"
      container.style.marginBottom = "1rem"
      container.textContent = code

      pre.replaceWith(container)

      try {
        const result = await mermaidInstance.render(diagramId, code)
        const svgContainer = document.createElement("div")
        svgContainer.className = "mermaid-svg-container"
        svgContainer.style.width = "100%"
        svgContainer.style.overflow = "auto"
        svgContainer.style.marginBottom = "1rem"
        svgContainer.innerHTML = result.svg
        container.replaceWith(svgContainer)
      } catch (error) {
        console.error("Error rendering Mermaid diagram:", error)
        container.textContent = `Error rendering diagram: ${(error as Error).message}`
        container.style.color = "red"
      }
    },
    [mermaidInstance]
  )

  // Execute JavaScript code
  const executeJavaScript = useCallback(
    (code: string, codeBlock: Element) => {
      if (!isBrowser) return

      const pre = codeBlock.parentElement
      if (!pre) return

      const existingOutput = pre.nextElementSibling
      if (
        existingOutput &&
        existingOutput.classList.contains("code-output-area")
      ) {
        existingOutput.remove()
      }

      const outputArea = document.createElement("div")
      outputArea.className = "code-output-area"
      outputArea.style.marginTop = "0"
      outputArea.style.marginBottom = "1rem"
      outputArea.style.padding = "0.75rem"
      outputArea.style.backgroundColor =
        resolvedTheme === "dark" ? "#1e1e1e" : "#f8f8f8"
      outputArea.style.color = resolvedTheme === "dark" ? "#e0e0e0" : "#333"
      outputArea.style.borderBottomLeftRadius = "4px"
      outputArea.style.borderBottomRightRadius = "4px"
      outputArea.style.fontSize = "0.9rem"
      outputArea.style.overflow = "auto"

      const separator = document.createElement("div")
      separator.style.height = "1px"
      separator.style.backgroundColor =
        resolvedTheme === "dark" ? "#444" : "#ddd"
      separator.style.margin = "0 0 0.75rem 0"
      outputArea.appendChild(separator)

      const outputContent = document.createElement("div")
      outputContent.className = "code-output-content"
      outputArea.appendChild(outputContent)

      pre.after(outputArea)

      const originalConsoleLog = console.log
      const logs: string[] = []

      console.log = (...args) => {
        originalConsoleLog.apply(console, args)
        const log = args
          .map((arg) =>
            typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
          )
          .join(" ")
        logs.push(log)
        outputContent.innerHTML = logs.map((l) => `<div>${l}</div>`).join("")
      }

      try {
        const executeCode = new Function(code)
        executeCode()
      } catch (error) {
        console.error("Error executing JavaScript:", error)
        const errorMsg = document.createElement("div")
        errorMsg.style.color = "red"
        errorMsg.textContent = `Error: ${(error as Error).message}`
        outputContent.appendChild(errorMsg)
      } finally {
        console.log = originalConsoleLog
        if (outputContent.children.length === 0) {
          outputContent.textContent = "Code executed successfully with no output"
        }
      }
    },
    [resolvedTheme]
  )

  // Process code blocks
  const processCodeBlocks = useCallback(() => {
    if (!isBrowser || !previewRef.current) return

    console.log('🔍 [OptimizedPreview] processCodeBlocks called')
    console.log('  - mermaidInstance:', !!mermaidInstance)
    console.log('  - previewRef.current:', !!previewRef.current)

    // Process Mermaid diagrams first if mermaidInstance is ready
    if (mermaidInstance) {
      const mermaidBlocks = previewRef.current.querySelectorAll(
        "pre > code.language-mermaid"
      )
      console.log('🎨 [OptimizedPreview] Found Mermaid blocks:', mermaidBlocks.length)

      mermaidBlocks.forEach((block, index) => {
        console.log(`  - Processing Mermaid block ${index + 1}`)
        console.log('  - Code length:', block.textContent?.length)
        console.log('  - Parent element:', block.parentElement?.tagName)

        try {
          renderMermaidDiagram(block.textContent || "", block as Element)
          console.log(`  ✅ Rendered Mermaid block ${index + 1}`)
        } catch (error) {
          console.error(`  ❌ Error rendering Mermaid block ${index + 1}:`, error)
        }
      })
    } else {
      console.log('⏳ [OptimizedPreview] Mermaid not ready yet, skipping diagram rendering')
    }

    const codeBlockTheme =
      resolvedTheme === "dark" ? "github-dark" : "github-light"

    // Process all code blocks (excluding mermaid which is already handled)
    const codeBlocks = previewRef.current.querySelectorAll("pre > code")

    codeBlocks.forEach((codeBlock) => {
      const pre = codeBlock.parentElement
      if (!pre || pre.querySelector(".code-block-processed")) return

      const languageClass = Array.from(codeBlock.classList).find((cls) =>
        cls.startsWith("language-")
      )
      const language = languageClass
        ? languageClass.replace("language-", "")
        : "text"

      // Skip mermaid blocks - they're already handled above
      if (language === "mermaid") {
        return
      }

      pre.classList.add("code-block-processed")

      const code = codeBlock.textContent || ""

      const codeBlockContainer = document.createElement("div")
      codeBlockContainer.className = "code-block-container"

      const codeBlockWrapper = document.createElement("div")
      codeBlockWrapper.className =
        "not-prose flex w-full flex-col overflow-clip border border-border bg-card text-card-foreground rounded-xl"
      codeBlockWrapper.style.position = "relative"

      const codeContent = document.createElement("div")
      codeContent.className =
        "w-full overflow-x-auto text-[13px] [&>pre]:px-4 [&>pre]:py-4"

      if (language === "js" || language === "javascript") {
        codeContent.innerHTML = `<pre><code class="language-${language}">${code}</code></pre>`

        const buttonContainer = document.createElement("div")
        buttonContainer.className = "code-run-button-container"
        buttonContainer.style.position = "absolute"
        buttonContainer.style.top = "0.5rem"
        buttonContainer.style.right = "0.5rem"
        buttonContainer.style.zIndex = "10"

        const runButton = document.createElement("button")
        runButton.className = "code-run-button"
        runButton.title = "Run JavaScript"
        runButton.innerHTML =
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>'
        runButton.style.display = "flex"
        runButton.style.alignItems = "center"
        runButton.style.justifyContent = "center"
        runButton.style.backgroundColor =
          resolvedTheme === "dark" ? "#333" : "#f0f0f0"
        runButton.style.color = resolvedTheme === "dark" ? "#eee" : "#555"
        runButton.style.border = "none"
        runButton.style.borderRadius = "4px"
        runButton.style.width = "28px"
        runButton.style.height = "28px"
        runButton.style.cursor = "pointer"
        runButton.style.opacity = "0.7"
        runButton.style.transition = "all 0.2s"

        runButton.addEventListener("mouseenter", () => {
          runButton.style.opacity = "0.9"
        })
        runButton.addEventListener("mouseleave", () => {
          runButton.style.opacity = "0.7"
        })

        runButton.addEventListener("click", (e) => {
          e.preventDefault()
          e.stopPropagation()
          const jsCodeElement = codeContent.querySelector("code")
          if (jsCodeElement) {
            executeJavaScript(jsCodeElement.textContent || "", jsCodeElement)
          }
        })

        buttonContainer.appendChild(runButton)
        codeBlockWrapper.appendChild(buttonContainer)
      } else {
        // Use Shiki for syntax highlighting
        codeContent.setAttribute("data-code", code)
        codeContent.setAttribute("data-language", language)
        codeContent.setAttribute("data-theme", codeBlockTheme)
        codeContent.classList.add("shiki-code-block")
        codeContent.innerHTML = `<pre><code class="language-${language}">${code}</code></pre>`
      }

      codeBlockWrapper.appendChild(codeContent)
      codeBlockContainer.appendChild(codeBlockWrapper)
      pre.replaceWith(codeBlockContainer)
    })
  }, [resolvedTheme, executeJavaScript, mermaidInstance, renderMermaidDiagram])

  // Process code blocks after HTML is ready AND Mermaid is initialized
  useEffect(() => {
    if (!isBrowser || !html || !mermaidInstance) return

    setTimeout(() => {
      processCodeBlocks()
    }, 0)
  }, [html, mermaidInstance, processCodeBlocks])

  // Highlight code with Shiki
  useEffect(() => {
    if (!isBrowser || !previewRef.current) return

    const shikiBlocks = previewRef.current.querySelectorAll(".shiki-code-block")
    if (shikiBlocks.length === 0) return

    shikiBlocks.forEach((block) => {
      const code = block.getAttribute("data-code") || ""
      const language = block.getAttribute("data-language") || "text"
      const blockTheme = block.getAttribute("data-theme") || "github-light"

      const container = document.createElement("div")
      const codeElement = document.createElement("div")
      codeElement.className =
        "w-full overflow-x-auto text-[13px] [&>pre]:px-4 [&>pre]:py-4"
      codeElement.innerHTML = `<pre><code class="language-${language}">${code}</code></pre>`
      codeElement.setAttribute("data-shiki-target", "true")
      container.appendChild(codeElement)
      block.replaceWith(container)

      codeToHtml(code, { lang: language, theme: blockTheme })
        .then((html) => {
          const target = container.querySelector("[data-shiki-target]")
          if (target) {
            target.innerHTML = html
          }
        })
        .catch((err) => {
          console.error("Error highlighting code with Shiki:", err)
        })
    })
  }, [html, resolvedTheme])

  if (error) {
    return (
      <div
        className={cn(
          "prose w-full max-w-none overflow-auto rounded-md border border-[hsl(var(--markdown-input-border))] bg-[hsl(var(--markdown-input-bg))] px-6 py-4 text-[hsl(var(--markdown-input-text))] shadow-inner dark:prose-invert",
          className
        )}
      >
        <p className="text-red-500">Error: {error}</p>
      </div>
    )
  }

  return (
    <div
      ref={previewRef}
      className={cn(
        "prose w-full max-w-none overflow-auto rounded-md border border-[hsl(var(--markdown-input-border))] bg-[hsl(var(--markdown-input-bg))] px-6 py-4 text-[hsl(var(--markdown-input-text))] shadow-inner dark:prose-invert",
        "prose-headings:text-[hsl(var(--foreground))] prose-p:text-[hsl(var(--markdown-input-text))]",
        "prose-a:text-[hsl(var(--markdown-toolbar-active))] prose-a:no-underline hover:prose-a:underline",
        "prose-code:rounded-sm prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:text-[hsl(var(--foreground))]",
        "prose-pre:bg-muted prose-pre:shadow-sm",
        isProcessing && "opacity-70",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
      data-testid="optimized-markdown-preview"
    />
  )
}
