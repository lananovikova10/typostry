"use client"

import { useEffect, useState, useRef } from "react"
import { remark } from "remark"
import remarkGfm from "remark-gfm"
import remarkHtml from "remark-html"
import { Play } from "lucide-react"

import { cn } from "@/lib/utils"
import { replaceEmojis } from "@/lib/emoji"

export interface MarkdownPreviewProps {
  source: string
  className?: string
}

export function MarkdownPreview({ source, className }: MarkdownPreviewProps) {
  const [html, setHtml] = useState("")
  const previewRef = useRef<HTMLDivElement>(null)
  
  // Function to execute JavaScript code and display output under the code block
  const executeJavaScript = (code: string, codeBlock: Element) => {
    // Find or create output area
    const pre = codeBlock.parentElement
    if (!pre) return

    // Remove any existing output area
    const existingOutput = pre.nextElementSibling
    if (existingOutput && existingOutput.classList.contains('code-output-area')) {
      existingOutput.remove()
    }

    // Create new output area
    const outputArea = document.createElement('div')
    outputArea.className = 'code-output-area'
    outputArea.style.marginTop = '0' // Connect directly to code block
    outputArea.style.marginBottom = '1rem'
    outputArea.style.padding = '0.75rem'
    outputArea.style.backgroundColor = '#f8f8f8'
    outputArea.style.borderBottomLeftRadius = '4px'
    outputArea.style.borderBottomRightRadius = '4px'
    outputArea.style.fontSize = '0.9rem'
    outputArea.style.color = '#333'
    outputArea.style.overflow = 'auto'
    
    // Add separator line
    const separator = document.createElement('div')
    separator.style.height = '1px'
    separator.style.backgroundColor = '#ddd'
    separator.style.margin = '0 0 0.75rem 0'
    outputArea.appendChild(separator)

    // Create output content container
    const outputContent = document.createElement('div')
    outputContent.className = 'code-output-content'
    outputArea.appendChild(outputContent)

    // Insert output area after the code block
    pre.after(outputArea)

    // Capture console.log outputs
    const originalConsoleLog = console.log
    const logs: string[] = []

    console.log = (...args) => {
      originalConsoleLog.apply(console, args)
      const log = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      logs.push(log)
      
      // Update output content
      outputContent.innerHTML = logs.map(l => `<div>${l}</div>`).join('')
    }

    try {
      // Using Function constructor for safer execution than eval
      const executeCode = new Function(code)
      executeCode()
    } catch (error) {
      console.error("Error executing JavaScript:", error)
      
      // Display error in output area
      const errorMsg = document.createElement('div')
      errorMsg.style.color = 'red'
      errorMsg.textContent = `Error: ${(error as Error).message}`
      outputContent.appendChild(errorMsg)
    } finally {
      // Restore original console.log
      console.log = originalConsoleLog
      
      // If no output was generated, show a message
      if (outputContent.children.length === 0) {
        outputContent.textContent = 'Code executed successfully with no output'
      }
    }
  }

  // Function to add run buttons to JavaScript code blocks
  const addRunButtonsToCodeBlocks = () => {
    if (!previewRef.current) return
    
    // Find all pre > code elements with language-js or language-javascript class
    const jsCodeBlocks = previewRef.current.querySelectorAll(
      'pre > code.language-js, pre > code.language-javascript'
    )
    
    jsCodeBlocks.forEach((codeBlock, index) => {
      const pre = codeBlock.parentElement
      if (!pre || pre.querySelector('.code-run-button')) return // Skip if already processed
      
      // Create button container with absolute positioning
      const buttonContainer = document.createElement('div')
      buttonContainer.className = 'code-run-button-container'
      buttonContainer.style.position = 'absolute'
      buttonContainer.style.top = '0.5rem'
      buttonContainer.style.right = '0.5rem'
      
      // Create run button
      const runButton = document.createElement('button')
      runButton.className = 'code-run-button'
      runButton.title = 'Run JavaScript'
      runButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>'
      runButton.style.display = 'flex'
      runButton.style.alignItems = 'center'
      runButton.style.justifyContent = 'center'
      runButton.style.backgroundColor = '#4CAF50'
      runButton.style.color = 'white'
      runButton.style.border = 'none'
      runButton.style.borderRadius = '4px'
      runButton.style.width = '28px'
      runButton.style.height = '28px'
      runButton.style.cursor = 'pointer'
      runButton.style.opacity = '0.8'
      runButton.style.transition = 'opacity 0.2s'
      
      // Hover effect
      runButton.addEventListener('mouseenter', () => {
        runButton.style.opacity = '1'
      })
      runButton.addEventListener('mouseleave', () => {
        runButton.style.opacity = '0.8'
      })
      
      // Set up click event to execute the code
      runButton.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const code = codeBlock.textContent || ''
        executeJavaScript(code, codeBlock)
      })
      
      // Add button to container and container to pre
      buttonContainer.appendChild(runButton)
      
      // Make sure the pre has position relative for absolute positioning of the button
      pre.style.position = 'relative'
      pre.style.marginBottom = '0' // Remove margin to connect with output area
      pre.style.borderBottomLeftRadius = '0' // Remove bottom radius when output is shown
      pre.style.borderBottomRightRadius = '0' // Remove bottom radius when output is shown
      pre.appendChild(buttonContainer)
    })
  }

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

  // Add run buttons after the HTML has been rendered
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (html) {
      // Use setTimeout to ensure the DOM has been updated
      setTimeout(() => {
        addRunButtonsToCodeBlocks()
      }, 0)
    }
  }, [html])

  return (
    <div
      ref={previewRef}
      className={cn(
        "prose w-full max-w-none overflow-auto px-6 py-4 dark:prose-invert bg-[hsl(var(--markdown-input-bg))] text-[hsl(var(--markdown-input-text))] border border-[hsl(var(--markdown-input-border))] shadow-inner rounded-md",
        "prose-headings:text-[hsl(var(--foreground))] prose-p:text-[hsl(var(--markdown-input-text))]",
        "prose-a:text-[hsl(var(--markdown-toolbar-active))] prose-a:no-underline hover:prose-a:underline",
        "prose-code:bg-secondary prose-code:text-[hsl(var(--foreground))] prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm",
        "prose-pre:bg-muted prose-pre:shadow-sm",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
      data-testid="markdown-preview"
    />
  )
}
