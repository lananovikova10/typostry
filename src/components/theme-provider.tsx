"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

// Extended ThemeProvider to include high-contrast themes
// Always render the provider: swapping a placeholder <div> for it after mount
// would unmount and remount the whole app. Theme-dependent UI guards itself
// with useThemeSafe, and the inline script in layout.tsx prevents a flash.
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      {...props}
      themes={[
        "light",
        "dark",
        "system",
        "high-contrast-light",
        "high-contrast-dark",
        "high-contrast-blue",
        "high-contrast-amber",
        "acid",
        "catppuccin-mocha",
      ]}
      storageKey="typostry-theme"
      enableColorScheme={false}
    >
      {children}
    </NextThemesProvider>
  )
}
