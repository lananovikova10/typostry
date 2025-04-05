"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

// Extended ThemeProvider to include high-contrast themes
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      {...props}
      themes={['light', 'dark', 'system', 'high-contrast-light', 'high-contrast-dark']}
    >
      {children}
    </NextThemesProvider>
  )
}
