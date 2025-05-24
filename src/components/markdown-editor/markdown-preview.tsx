"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import { remark } from "remark"
import remarkGfm from "remark-gfm"
import remarkHtml from "remark-html"
import { codeToHtml } from "shiki"

import { replaceEmojis } from "@/lib/emoji"
import { cn } from "@/lib/utils"
import { CodeBlock, CodeBlockCode } from "@/components/ui/code-block"

// Don't need to use dynamic for mermaid as we'll import it directly in useEffect

export interface MarkdownPreviewProps {
  source: string
  className?: string
}

export function MarkdownPreview({ source, className }: MarkdownPreviewProps) {
  const [html, setHtml] = useState("")
  const [mermaidInstance, setMermaidInstance] = useState<any>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const { theme, resolvedTheme } = useTheme()

  // Initialize mermaid library on client-side only
  useEffect(() => {
    const initMermaid = async () => {
      try {
        // Dynamically import mermaid
        const mermaid = await import("mermaid")

        // Initialize with theme-specific configuration
        mermaid.default.initialize({
          startOnLoad: false,
          theme: resolvedTheme === "dark" ? "dark" : "default",
          securityLevel: "loose", // needed for client-side rendering
          fontFamily: "inherit",
        })

        // Set the mermaid instance for later use
        setMermaidInstance(mermaid.default)
      } catch (error) {
        console.error("Failed to initialize mermaid:", error)
      }
    }

    initMermaid()
  }, [resolvedTheme]) // Function to render Mermaid diagrams
  const renderMermaidDiagram = useCallback(
    async (code: string, codeBlock: Element) => {
      if (!mermaidInstance) {
        console.warn("Mermaid instance not initialized")
        return
      }

      // Find parent element
      const pre = codeBlock.parentElement
      if (!pre) return

      // Create a unique ID for the diagram
      const diagramId = `mermaid-diagram-${Math.random().toString(36).substring(2, 11)}`

      // Create container for the Mermaid diagram
      const container = document.createElement("div")
      container.id = diagramId
      container.className = "mermaid-diagram"
      container.style.width = "100%"
      container.style.overflow = "auto"
      container.style.marginBottom = "1rem"
      container.textContent = code

      // Replace the pre element with our Mermaid container
      pre.replaceWith(container)

      try {
        // Render the Mermaid diagram
        const result = await mermaidInstance.render(diagramId, code)

        // Create a wrapper for the SVG
        const svgContainer = document.createElement("div")
        svgContainer.className = "mermaid-svg-container"
        svgContainer.style.width = "100%"
        svgContainer.style.overflow = "auto"
        svgContainer.style.marginBottom = "1rem"
        svgContainer.innerHTML = result.svg

        // Replace the container with the rendered SVG
        container.replaceWith(svgContainer)
      } catch (error) {
        console.error("Error rendering Mermaid diagram:", error)
        container.textContent = `Error rendering diagram: ${(error as Error).message}`
        container.style.color = "red"
      }
    },
    [mermaidInstance]
  )

  // Function to execute JavaScript code and display output under the code block
  const executeJavaScript = useCallback(
    (code: string, codeBlock: Element) => {
      // Find or create output area
      const pre = codeBlock.parentElement
      if (!pre) return

      // Remove any existing output area
      const existingOutput = pre.nextElementSibling
      if (
        existingOutput &&
        existingOutput.classList.contains("code-output-area")
      ) {
        existingOutput.remove()
      }

      // Create new output area
      const outputArea = document.createElement("div")
      outputArea.className = "code-output-area"
      outputArea.style.marginTop = "0" // Connect directly to code block
      outputArea.style.marginBottom = "1rem"
      outputArea.style.padding = "0.75rem"
      outputArea.style.backgroundColor =
        resolvedTheme === "dark" ? "#1e1e1e" : "#f8f8f8"
      outputArea.style.color = resolvedTheme === "dark" ? "#e0e0e0" : "#333"
      outputArea.style.borderBottomLeftRadius = "4px"
      outputArea.style.borderBottomRightRadius = "4px"
      outputArea.style.fontSize = "0.9rem"
      outputArea.style.overflow = "auto"

      // Add separator line
      const separator = document.createElement("div")
      separator.style.height = "1px"
      separator.style.backgroundColor =
        resolvedTheme === "dark" ? "#444" : "#ddd"
      separator.style.margin = "0 0 0.75rem 0"
      outputArea.appendChild(separator)

      // Create output content container
      const outputContent = document.createElement("div")
      outputContent.className = "code-output-content"
      outputArea.appendChild(outputContent)

      // Insert output area after the code block
      pre.after(outputArea)

      // Capture console.log outputs
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

        // Update output content
        outputContent.innerHTML = logs.map((l) => `<div>${l}</div>`).join("")
      }

      try {
        // Using Function constructor for safer execution than eval
        const executeCode = new Function(code)
        executeCode()
      } catch (error) {
        console.error("Error executing JavaScript:", error)

        // Display error in output area
        const errorMsg = document.createElement("div")
        errorMsg.style.color = "red"
        errorMsg.textContent = `Error: ${(error as Error).message}`
        outputContent.appendChild(errorMsg)
      } finally {
        // Restore original console.log
        console.log = originalConsoleLog

        // If no output was generated, show a message
        if (outputContent.children.length === 0) {
          outputContent.textContent =
            "Code executed successfully with no output"
        }
      }
    },
    [resolvedTheme]
  )

  // Function to replace code blocks with CodeBlock component
  const processCodeBlocks = useCallback(() => {
    if (!previewRef.current) return

    // Determine the theme to use for code blocks
    const codeBlockTheme =
      resolvedTheme === "dark" ? "github-dark" : "github-light"

    // Process any mermaid diagrams if mermaidInstance is available
    if (mermaidInstance) {
      const mermaidBlocks = previewRef.current.querySelectorAll(
        "pre.mermaid-pre > code.language-mermaid"
      )
      mermaidBlocks.forEach((block) => {
        renderMermaidDiagram(block.textContent || "", block as Element)
      })
    }

    // Find all pre > code elements
    const codeBlocks = previewRef.current.querySelectorAll("pre > code")

    codeBlocks.forEach((codeBlock) => {
      const pre = codeBlock.parentElement
      if (!pre || pre.querySelector(".code-block-processed")) return // Skip if already processed

      // Mark as processed
      pre.classList.add("code-block-processed")

      // Get the language from the class (language-xxx)
      const languageClass = Array.from(codeBlock.classList).find((cls) =>
        cls.startsWith("language-")
      )
      const language = languageClass
        ? languageClass.replace("language-", "")
        : "text"

      // Get the code content
      const code = codeBlock.textContent || ""

      // Create a container to hold our custom CodeBlock
      const codeBlockContainer = document.createElement("div")
      codeBlockContainer.className = "code-block-container"

      // Create CodeBlock wrapper
      const codeBlockWrapper = document.createElement("div")
      codeBlockWrapper.className =
        "not-prose flex w-full flex-col overflow-clip border border-border bg-card text-card-foreground rounded-xl"
      codeBlockWrapper.style.position = "relative"

      // Create the code content element
      const codeContent = document.createElement("div")
      codeContent.className =
        "w-full overflow-x-auto text-[13px] [&>pre]:px-4 [&>pre]:py-4"

      // For Mermaid diagrams
      if (language === "mermaid") {
        // We don't need the code block wrapper for Mermaid
        codeContent.innerHTML = `<pre class="mermaid-pre"><code class="language-${language}">${code}</code></pre>`

        // Process the Mermaid diagram
        const mermaidCodeElement = codeContent.querySelector("code")
        if (mermaidCodeElement && mermaidInstance) {
          renderMermaidDiagram(code, mermaidCodeElement)
        }

        // Skip the rest of the processing for Mermaid
        return
      }
      // For JavaScript code, make sure we keep the pre > code structure for executability
      else if (language === "js" || language === "javascript") {
        codeContent.innerHTML = `<pre><code class="language-${language}">${code}</code></pre>`

        // Create button container with absolute positioning
        const buttonContainer = document.createElement("div")
        buttonContainer.className = "code-run-button-container"
        buttonContainer.style.position = "absolute"
        buttonContainer.style.top = "0.5rem"
        buttonContainer.style.right = "0.5rem"
        buttonContainer.style.zIndex = "10"

        // Create run button
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
        runButton.style.boxShadow =
          resolvedTheme === "dark"
            ? "0 1px 2px rgba(0,0,0,0.3)"
            : "0 1px 2px rgba(0,0,0,0.1)"

        // Hover effect
        runButton.addEventListener("mouseenter", () => {
          runButton.style.opacity = "0.9"
          runButton.style.boxShadow =
            resolvedTheme === "dark"
              ? "0 1px 3px rgba(0,0,0,0.5)"
              : "0 1px 3px rgba(0,0,0,0.15)"
        })
        runButton.addEventListener("mouseleave", () => {
          runButton.style.opacity = "0.7"
          runButton.style.boxShadow =
            resolvedTheme === "dark"
              ? "0 1px 2px rgba(0,0,0,0.3)"
              : "0 1px 2px rgba(0,0,0,0.1)"
        })

        // Set up click event to execute the code
        runButton.addEventListener("click", (e) => {
          e.preventDefault()
          e.stopPropagation()
          const jsCodeElement = codeContent.querySelector("code")
          if (jsCodeElement) {
            const jsCode = jsCodeElement.textContent || ""
            executeJavaScript(jsCode, jsCodeElement)
          }
        })

        // Add button to container and container to wrapper
        buttonContainer.appendChild(runButton)
        codeBlockWrapper.appendChild(buttonContainer)
      } else {
        // For non-JS code, use Shiki highlighting via the CodeBlockCode component
        // We'll do this in React after hydration, for now just add placeholders
        codeContent.setAttribute("data-code", code)
        codeContent.setAttribute("data-language", language)
        codeContent.setAttribute("data-theme", codeBlockTheme)
        codeContent.classList.add("shiki-code-block")

        // Add placeholder content until hydration
        codeContent.innerHTML = `<pre><code class="language-${language}">${code}</code></pre>`
      }

      codeBlockWrapper.appendChild(codeContent)
      codeBlockContainer.appendChild(codeBlockWrapper)

      // Replace the original pre element with our custom block
      pre.replaceWith(codeBlockContainer)
    })
  }, [resolvedTheme, executeJavaScript, mermaidInstance, renderMermaidDiagram])

  useEffect(() => {
    const parseMarkdown = async () => {
      try {
        // Replace emoji shortcodes with actual emoji characters
        const processedSource = replaceEmojis(source)

        // Process markdown content
        const result = await remark()
          .use(remarkGfm)
          .use(remarkHtml)
          .process(processedSource)

        let htmlContent = result.toString()

        // Add IDs to headings for navigation
        // Look for heading tags <h1> through <h6>
        htmlContent = htmlContent.replace(
          /<(h[1-6])>(.*?)<\/h[1-6]>/g,
          (match, tag, content) => {
            const id = content
              .toLowerCase()
              .replace(/<\/?[^>]+(>|$)/g, "") // Remove HTML tags inside heading
              .replace(/[^\w\s-]/g, "") // Remove special chars
              .replace(/\s+/g, "-") // Replace spaces with hyphens
              .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen

            return `<${tag} id="${id}">${content}</${tag}>`
          }
        )

        setHtml(htmlContent)
      } catch (error) {
        console.error("Error parsing markdown:", error)
        setHtml("<p>Error rendering markdown</p>")
      }
    }

    parseMarkdown()
  }, [source])

  // Initialize Mermaid
  useEffect(() => {
    let mounted = true

    const initMermaid = async () => {
      try {
        const mermaidModule = await import("mermaid")
        const mermaid = mermaidModule.default

        if (mounted) {
          // Initialize Mermaid with configuration
          mermaid.initialize({
            startOnLoad: false,
            theme: resolvedTheme === "dark" ? "dark" : "default",
            securityLevel: "loose",
            fontFamily: "inherit",
          })

          setMermaidInstance(mermaid)
        }
      } catch (error) {
        console.error("Failed to load Mermaid:", error)
      }
    }

    initMermaid()

    return () => {
      mounted = false
    }
  }, [resolvedTheme])

  // Process code blocks after the HTML has been rendered
  useEffect(() => {
    if (html) {
      // Use setTimeout to ensure the DOM has been updated
      setTimeout(() => {
        processCodeBlocks()
      }, 0)
    }
  }, [html, processCodeBlocks])

  // React-based code block rendering for non-JS blocks after hydration
  useEffect(() => {
    if (!previewRef.current) return

    const shikiBlocks = previewRef.current.querySelectorAll(".shiki-code-block")
    if (shikiBlocks.length === 0) return

    shikiBlocks.forEach((block) => {
      const code = block.getAttribute("data-code") || ""
      const language = block.getAttribute("data-language") || "text"
      const blockTheme = block.getAttribute("data-theme") || "github-light"

      // Create a temporary container
      const container = document.createElement("div")

      // Create the code content element
      const codeElement = document.createElement("div")
      codeElement.className =
        "w-full overflow-x-auto text-[13px] [&>pre]:px-4 [&>pre]:py-4"

      // Set placeholder until Shiki processes the code
      codeElement.innerHTML = `<pre><code class="language-${language}">${code}</code></pre>`
      codeElement.setAttribute("data-shiki-target", "true")

      container.appendChild(codeElement)

      // Replace the original element
      block.replaceWith(container)

      // Process with Shiki
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

  return (
    <div
      ref={previewRef}
      className={cn(
        "prose w-full max-w-none overflow-auto rounded-md border border-[hsl(var(--markdown-input-border))] bg-[hsl(var(--markdown-input-bg))] px-6 py-4 text-[hsl(var(--markdown-input-text))] shadow-inner dark:prose-invert",
        "prose-headings:text-[hsl(var(--foreground))] prose-p:text-[hsl(var(--markdown-input-text))]",
        "prose-a:text-[hsl(var(--markdown-toolbar-active))] prose-a:no-underline hover:prose-a:underline",
        "prose-code:rounded-sm prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:text-[hsl(var(--foreground))]",
        "prose-pre:bg-muted prose-pre:shadow-sm",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
      data-testid="markdown-preview"
    />
  )
}
