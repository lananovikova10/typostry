"use client"

import React, { useEffect, useRef, useState } from "react"

/**
 * SpotlightOverlay will display a spotlight effect around the cursor,
 * but only when hovering outside the editor and preview areas.
 *
 * Expects the editor and preview to have data-testid="markdown-editor" and "markdown-preview" respectively.
 */
const SPOTLIGHT_RADIUS = 100

export function SpotlightOverlay() {
  const [show, setShow] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      setCoords({ x: e.clientX, y: e.clientY })
    }
    function handleMouseOver(e: MouseEvent) {
      // Check if target is inside editor or preview
      const editor = document.querySelector('[data-testid="markdown-editor"]')
      const preview = document.querySelector('[data-testid="markdown-preview"]')
      if (
        (editor && editor.contains(e.target as Node)) ||
        (preview && preview.contains(e.target as Node))
      ) {
        setShow(false)
      } else {
        setShow(true)
      }
    }
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseover", handleMouseOver)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseover", handleMouseOver)
    }
  }, [])

  return (
    <div
      ref={overlayRef}
      className="spotlight-overlay"
      style={{
        WebkitMaskImage: `radial-gradient(circle ${SPOTLIGHT_RADIUS}px at ${coords.x}px ${coords.y}px, rgba(0,0,0,1) 80%, rgba(0,0,0,0.7) 100%)`,
        maskImage: `radial-gradient(circle ${SPOTLIGHT_RADIUS}px at ${coords.x}px ${coords.y}px, rgba(0,0,0,1) 80%, rgba(0,0,0,0.7) 100%)`,
        display: show ? "block" : "none",
      }}
      aria-hidden="true"
    />
  )
}
