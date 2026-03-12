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
  const { isLight, isDark, isHighContrast, isAcid, isCatppuccin, currentTheme } = useIsTheme()

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
  const showSun = isLight && !isHighContrast && !isAcid && !isCatppuccin
  const showMoon = isDark && !isHighContrast && !isAcid && !isCatppuccin
  const showContrast = isHighContrast
  const showZap = isAcid
  const showCoffee = isCatppuccin

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

          {/* Coffee icon for Catppuccin Mocha theme */}
          <Icons.coffee
            className={`absolute left-1/2 top-1/2 h-[1.2rem] w-[1.2rem] -translate-x-1/2 -translate-y-1/2 transition-all ${showCoffee ? "rotate-0 scale-100" : "rotate-90 scale-0"}`}
          />

          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light {currentTheme === "light" && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark {currentTheme === "dark" && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("high-contrast-light")}>
          High Contrast Light {currentTheme === "high-contrast-light" && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("high-contrast-dark")}>
          High Contrast Dark {currentTheme === "high-contrast-dark" && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("high-contrast-blue")}>
          High Contrast Blue {currentTheme === "high-contrast-blue" && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("high-contrast-amber")}>
          High Contrast Amber {currentTheme === "high-contrast-amber" && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("acid")}>
          Acid {isAcid && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("catppuccin-mocha")}>
          Catppuccin Mocha {isCatppuccin && "✓"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System {currentTheme === "system" && "✓"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
