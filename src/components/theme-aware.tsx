"use client"

import * as React from "react"
import { useIsTheme } from "@/hooks/use-theme-safe"

interface ThemeAwareProps {
  children: React.ReactNode | ((themeInfo: ReturnType<typeof useIsTheme>) => React.ReactNode)
  fallback?: React.ReactNode
  className?: string
}

/**
 * A component that renders children only after theme is loaded
 * Prevents hydration mismatches for theme-dependent content
 */
export function ThemeAware({ children, fallback, className }: ThemeAwareProps) {
  const themeInfo = useIsTheme()

  if (!themeInfo.mounted) {
    return fallback ? <div className={className}>{fallback}</div> : null
  }

  return (
    <div className={className} suppressHydrationWarning>
      {typeof children === "function" ? children(themeInfo) : children}
    </div>
  )
}

interface ConditionalThemeProps {
  when: keyof Pick<ReturnType<typeof useIsTheme>, "isLight" | "isDark" | "isHighContrast" | "isAcid" | "isSystem">
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Renders children conditionally based on theme
 * Only renders after theme is loaded to prevent hydration issues
 */
export function ConditionalTheme({ when, children, fallback }: ConditionalThemeProps) {
  const themeInfo = useIsTheme()

  if (!themeInfo.mounted) {
    return fallback || null
  }

  return themeInfo[when] ? (
    <div suppressHydrationWarning>{children}</div>
  ) : fallback ? (
    <div suppressHydrationWarning>{fallback}</div>
  ) : null
}

/**
 * A higher-order component that wraps components requiring theme information
 */
export function withThemeAware<P extends object>(
  Component: React.ComponentType<P & { themeInfo: ReturnType<typeof useIsTheme> }>,
  fallback?: React.ReactNode
) {
  return function ThemeAwareComponent(props: P) {
    const themeInfo = useIsTheme()

    if (!themeInfo.mounted) {
      return fallback || null
    }

    return <Component {...props} themeInfo={themeInfo} />
  }
}