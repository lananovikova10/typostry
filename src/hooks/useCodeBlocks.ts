"use client"

import { useCallback, useEffect, RefObject } from "react"
import { useTheme } from "next-themes"
import { codeToHtml } from "shiki"

const isBrowser = typeof window !== "undefined"

interface UseCodeBlocksProps {
  previewRef: RefObject<HTMLDivElement>
  executeJavaScript: (code: string, codeBlock: Element) => void
}

/**
 * Custom hook for processing code blocks in markdown previews
 * Handles syntax highlighting, JavaScript execution buttons, and Shiki integration
 */
export function useCodeBlocks({ previewRef, executeJavaScript }: UseCodeBlocksProps) {
  const { resolvedTheme } = useTheme()

  const processCodeBlocks = useCallback(() => {
    if (!isBrowser) return // Skip on server-side
    if (!previewRef.current) return

    // Determine the theme to use for code blocks
    const codeBlockTheme =
      resolvedTheme === "dark" ? "github-dark" : "github-light"

    // Find all pre > code elements
    const codeBlocks = previewRef.current.querySelectorAll("pre > code")

    codeBlocks.forEach((codeBlock) => {
      const pre = codeBlock.parentElement
      if (!pre || pre.querySelector(".code-block-processed")) return // Skip if already processed

      // Get the language from the class (language-xxx)
      const languageClass = Array.from(codeBlock.classList).find((cls) =>
        cls.startsWith("language-")
      )
      const language = languageClass
        ? languageClass.replace("language-", "")
        : "text"

      // Mark as processed
      pre.classList.add("code-block-processed")

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

      // For JavaScript code, make sure we keep the pre > code structure for executability
      if (language === "js" || language === "javascript") {
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
  }, [resolvedTheme, executeJavaScript, previewRef])

  // React-based code block rendering for non-JS blocks after hydration
  const processShikiBlocks = useCallback(() => {
    if (!isBrowser) return // Skip on server-side
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
  }, [previewRef, resolvedTheme])

  return {
    processCodeBlocks,
    processShikiBlocks,
  }
}