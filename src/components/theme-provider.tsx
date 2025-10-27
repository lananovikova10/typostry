"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

// Extended ThemeProvider to include high-contrast themes
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering theme-dependent content on server
  if (!mounted) {
    return <div suppressHydrationWarning>{children}</div>
  }

  return (
    <NextThemesProvider
      {...props}
      themes={[
        "light",
        "dark",
        "system",
        "high-contrast-light",
        "high-contrast-dark",
        "acid",
      ]}
      storageKey="typostry-theme"
      enableColorScheme={false}
    >
      {children}
    </NextThemesProvider>
  )
}
