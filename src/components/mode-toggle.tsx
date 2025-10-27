"use client"

import * as React from "react"
import { useThemeSafe, useIsTheme } from "@/hooks/use-theme-safe"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Icons } from "@/components/icons"

export function ModeToggle() {
  const { setTheme, mounted } = useThemeSafe()
  const { isLight, isDark, isHighContrast, isAcid, currentTheme } = useIsTheme()

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="outline" size="icon" suppressHydrationWarning>
        <Icons.sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Loading theme...</span>
      </Button>
    )
  }

  // Determine which icon to show based on theme combinations
  const showSun = isLight && !isHighContrast && !isAcid
  const showMoon = isDark && !isHighContrast && !isAcid
  const showContrast = isHighContrast
  const showZap = isAcid

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative flex items-center justify-center"
          suppressHydrationWarning
        >
          {/* Sun icon for light themes */}
          <Icons.sun
            className={`h-[1.2rem] w-[1.2rem] transition-all ${showSun && !showContrast && !showZap ? "rotate-0 scale-100" : "rotate-90 scale-0"}`}
          />

          {/* Moon icon for dark themes */}
          <Icons.moon
            className={`absolute left-1/2 top-1/2 h-[1.2rem] w-[1.2rem] -translate-x-1/2 -translate-y-1/2 transition-all ${showMoon && !showContrast && !showZap ? "rotate-0 scale-100" : "rotate-90 scale-0"}`}
          />

          {/* Contrast icon for high-contrast themes */}
          <Icons.contrast
            className={`absolute left-1/2 top-1/2 h-[1.2rem] w-[1.2rem] -translate-x-1/2 -translate-y-1/2 transition-all ${showContrast ? "rotate-0 scale-100" : "rotate-90 scale-0"}`}
          />

          {/* Zap icon for acid theme */}
          <Icons.zap
            className={`absolute left-1/2 top-1/2 h-[1.2rem] w-[1.2rem] -translate-x-1/2 -translate-y-1/2 transition-all ${showZap ? "rotate-0 scale-100" : "rotate-90 scale-0"}`}
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
            currentTheme?.includes("dark")
              ? setTheme("high-contrast-dark")
              : setTheme("high-contrast-light")
          }
        >
          High Contrast {isHighContrast && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("acid")}>
          Acid {isAcid && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
