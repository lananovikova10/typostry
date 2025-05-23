import "@/styles/globals.css"
import { Metadata } from "next"

import { siteConfig } from "@/config/site"
import { fontSans } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"
import { DotPattern } from "@/components/ui/dot-pattern"

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <head />
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased relative",
            fontSans.variable
          )}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <DotPattern
              className={cn(
                "fixed inset-0 -z-10",
                "[mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]",
                "fill-neutral-300/30 dark:fill-neutral-700/30",
                "data-[theme=ocean]:fill-blue-400/20 dark:data-[theme=ocean]:fill-blue-600/20",
                "data-[theme=sunset]:fill-orange-400/20 dark:data-[theme=sunset]:fill-orange-600/20",
                "data-[theme=forest]:fill-green-400/20 dark:data-[theme=forest]:fill-green-600/20",
                "data-[theme=lavender]:fill-purple-400/20 dark:data-[theme=lavender]:fill-purple-600/20",
                "data-[theme=rose]:fill-pink-400/20 dark:data-[theme=rose]:fill-pink-600/20"
              )}
              width={20}
              height={20}
              cx={1}
              cy={1}
              cr={1}
            />
            <div className="relative flex min-h-screen flex-col">
              <div className="flex-1">{children}</div>
            </div>
          </ThemeProvider>
        </body>
      </html>
    </>
  )
}