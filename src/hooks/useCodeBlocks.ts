"use client"

import { useCallback, RefObject } from "react"
import { useTheme } from "next-themes"
import { codeToHtml } from "shiki"

const isBrowser = typeof window !== "undefined"

function createCodeContentElement(language: string, code: string): HTMLDivElement {
  const codeContent = document.createElement("div")
  codeContent.className =
    "w-full overflow-x-auto text-[13px] [&>pre]:px-4 [&>pre]:py-4"

  const preElement = document.createElement("pre")
  const codeElement = document.createElement("code")
  codeElement.className = `language-${language}`
  codeElement.textContent = code
  preElement.appendChild(codeElement)
  codeContent.appendChild(preElement)

  return codeContent
}

// Picks a Shiki theme from the active app theme's background lightness,
// so every dark theme (not only "dark") gets a dark code palette
function getCodeBlockTheme(): string {
  const background = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--background")
  const lightness = parseFloat(background.trim().split(/\s+/)[2] ?? "")
  return !Number.isNaN(lightness) && lightness < 50
    ? "github-dark"
    : "github-light"
}

function highlight(target: Element, code: string, language: string, theme: string) {
  target.setAttribute("data-theme", theme)
  codeToHtml(code, { lang: language, theme })
    .then((html) => {
      // Skip if the theme changed again while highlighting
      if (target.getAttribute("data-theme") === theme) {
        target.innerHTML = html
      }
    })
    .catch((err) => {
      console.error("Error highlighting code with Shiki:", err)
    })
}

/**
 * Custom hook for processing code blocks in markdown previews
 * Handles syntax highlighting and Shiki integration
 */
export function useCodeBlocks(previewRef: RefObject<HTMLDivElement>) {
  const { resolvedTheme } = useTheme()

  const processCodeBlocks = useCallback(() => {
    if (!isBrowser) return // Skip on server-side
    if (!previewRef.current) return

    // Determine the theme to use for code blocks
    const codeBlockTheme = getCodeBlockTheme()

    // Re-highlight blocks that were already rendered with another theme
    previewRef.current
      .querySelectorAll("[data-shiki-target]")
      .forEach((target) => {
        if (target.getAttribute("data-theme") !== codeBlockTheme) {
          highlight(
            target,
            target.getAttribute("data-code") || "",
            target.getAttribute("data-language") || "text",
            codeBlockTheme
          )
        }
      })

    // Find all pre > code elements
    const codeBlocks = previewRef.current.querySelectorAll("pre > code")

    codeBlocks.forEach((codeBlock) => {
      const pre = codeBlock.parentElement
      // Skip blocks we already wrapped, including Shiki's own <pre> output
      if (!pre || pre.closest(".code-block-container")) return

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
      const codeContent = createCodeContentElement(language, code)

      codeContent.setAttribute("data-code", code)
      codeContent.setAttribute("data-language", language)
      codeContent.setAttribute("data-theme", codeBlockTheme)
      codeContent.classList.add("shiki-code-block")

      codeBlockWrapper.appendChild(codeContent)
      codeBlockContainer.appendChild(codeBlockWrapper)

      // Replace the original pre element with our custom block
      pre.replaceWith(codeBlockContainer)
    })
    // resolvedTheme is not read here, but a new callback makes the preview
    // re-run this on theme change, which re-highlights existing blocks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme, previewRef])

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
      const codeElement = createCodeContentElement(language, code)
      codeElement.setAttribute("data-shiki-target", "true")
      codeElement.setAttribute("data-code", code)
      codeElement.setAttribute("data-language", language)

      container.appendChild(codeElement)

      // Replace the original element
      block.replaceWith(container)

      // Process with Shiki
      highlight(codeElement, code, language, blockTheme)
    })
  }, [previewRef])

  return {
    processCodeBlocks,
    processShikiBlocks,
  }
}
