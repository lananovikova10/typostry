"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type {
  MarkdownWorkerMessage,
  MarkdownWorkerResponse,
} from "@/workers/markdown.worker"

/**
 * Hook to use the markdown worker for processing markdown content
 * Offloads heavy markdown parsing to a Web Worker
 */
export function useMarkdownWorker() {
  const [html, setHtml] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const workerRef = useRef<Worker | null>(null)
  const jobIdRef = useRef<string>("")
  const pendingJobRef = useRef<string>("")

  // Initialize worker
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      // Create worker from the worker file
      workerRef.current = new Worker(
        new URL("@/workers/markdown.worker.ts", import.meta.url),
        { type: "module" }
      )

      // Handle messages from worker
      workerRef.current.addEventListener(
        "message",
        (event: MessageEvent<MarkdownWorkerResponse>) => {
          const { id, type, html: resultHtml, error: resultError } = event.data

          // Ignore if this is not the current job
          if (id !== jobIdRef.current) return

          if (type === "success" && resultHtml) {
            setHtml(resultHtml)
            setError(null)
          } else if (type === "error") {
            setError(resultError || "Unknown error occurred")
          }

          setIsProcessing(false)
          jobIdRef.current = ""
        }
      )

      // Handle errors
      workerRef.current.addEventListener("error", (event) => {
        console.error("Worker error:", event)
        setError("Worker error occurred")
        setIsProcessing(false)
      })
    } catch (err) {
      console.error("Failed to initialize worker:", err)
      setError("Failed to initialize worker")
    }

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  // Process markdown content
  const processMarkdown = useCallback(
    (content: string, debounceMs: number = 300) => {
      if (!workerRef.current) {
        setError("Worker not initialized")
        return
      }

      // Generate unique job ID
      const jobId = `job-${Date.now()}-${Math.random()}`
      pendingJobRef.current = jobId

      // Debounce the processing
      setTimeout(() => {
        // Check if this is still the pending job
        if (pendingJobRef.current !== jobId) return

        // Cancel previous job if exists
        if (jobIdRef.current) {
          const cancelMessage: MarkdownWorkerMessage = {
            id: jobIdRef.current,
            type: "cancel",
          }
          workerRef.current?.postMessage(cancelMessage)
        }

        // Set new job
        jobIdRef.current = jobId
        setIsProcessing(true)
        setError(null)

        // Send message to worker
        const message: MarkdownWorkerMessage = {
          id: jobId,
          type: "parse",
          content,
        }

        workerRef.current?.postMessage(message)
      }, debounceMs)
    },
    []
  )

  return {
    html,
    isProcessing,
    error,
    processMarkdown,
  }
}
