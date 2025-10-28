"use client"

import { useCallback } from "react"
import { useTheme } from "next-themes"

const isBrowser = typeof window !== "undefined"

/**
 * Custom hook for executing JavaScript code in markdown previews
 * Provides functionality to run JS code blocks and display output
 */
export function useCodeExecution() {
  const { resolvedTheme } = useTheme()

  const executeJavaScript = useCallback(
    (code: string, codeBlock: Element) => {
      if (!isBrowser) return // Skip on server-side

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

  return { executeJavaScript }
}