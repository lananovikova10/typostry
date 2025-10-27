"use client"

import { useTheme as useNextTheme } from "next-themes"
import { useEffect, useState } from "react"

/**
 * A safe version of useTheme that handles hydration properly
 * Returns undefined values during hydration to prevent mismatches
 */
export function useThemeSafe() {
  const [mounted, setMounted] = useState(false)
  const theme = useNextTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Return undefined values during hydration
  if (!mounted) {
    return {
      theme: undefined,
      setTheme: theme.setTheme,
      resolvedTheme: undefined,
      systemTheme: undefined,
      themes: theme.themes,
      mounted: false,
    }
  }

  return {
    ...theme,
    mounted: true,
  }
}

/**
 * Hook to get the current theme with proper loading state
 * Use this in components that need to render differently based on theme
 */
export function useIsTheme() {
  const { theme, resolvedTheme, mounted } = useThemeSafe()

  return {
    isLight: mounted && (theme === "light" || theme === "high-contrast-light" || (theme === "system" && resolvedTheme === "light")),
    isDark: mounted && (theme === "dark" || theme === "high-contrast-dark" || (theme === "system" && resolvedTheme === "dark")),
    isHighContrast: mounted && (theme === "high-contrast-light" || theme === "high-contrast-dark"),
    isAcid: mounted && theme === "acid",
    isSystem: mounted && theme === "system",
    currentTheme: mounted ? theme : undefined,
    resolvedTheme: mounted ? resolvedTheme : undefined,
    mounted,
  }
}