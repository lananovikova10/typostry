"use client"

import * as React from "react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Icons } from "@/components/icons"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Update mounted state after component mounts to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Check if the current theme is a high-contrast variant
  const isHighContrast =
    mounted &&
    (theme === "high-contrast-light" || theme === "high-contrast-dark")

  // Determine which icon to show based on theme combinations
  const showSun =
    mounted &&
    (theme === "light" ||
      theme === "high-contrast-light" ||
      (theme === "system" &&
        !window.matchMedia("(prefers-color-scheme: dark)").matches))
  const showMoon =
    mounted &&
    (theme === "dark" ||
      theme === "high-contrast-dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches))
  const showContrast =
    mounted &&
    (theme === "high-contrast-light" || theme === "high-contrast-dark")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          {/* Sun icon for light themes */}
          <Icons.sun
            className={`h-[1.2rem] w-[1.2rem] transition-all ${showSun && !showContrast ? "rotate-0 scale-100" : "rotate-90 scale-0"}`}
          />

          {/* Moon icon for dark themes */}
          <Icons.moon
            className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${showMoon && !showContrast ? "rotate-0 scale-100" : "rotate-90 scale-0"}`}
          />

          {/* Contrast icon for high-contrast themes */}
          <Icons.contrast
            className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${showContrast ? "rotate-0 scale-100" : "rotate-90 scale-0"}`}
          />

          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            theme?.includes("dark")
              ? setTheme("high-contrast-dark")
              : setTheme("high-contrast-light")
          }
        >
          High Contrast {isHighContrast && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
