import { env } from "@/env.mjs"
import { SiteConfig } from "@/types/site"

export const siteConfig: SiteConfig = {
  name: "typostry",
  author: "redpangilinan",
  description:
    "Next.js markdown editor component with real-time preview and theme support.",
  keywords: [
    "Next.js",
    "React",
    "Tailwind CSS",
    "Radix UI",
    "shadcn/ui",
    "Markdown",
  ],
  url: {
    base: env.NEXT_PUBLIC_APP_URL,
    author: "https://rdev.pro",
  },
  links: {
    github: "https://github.com/redpangilinan/next-entree",
  },
  ogImage: `${env.NEXT_PUBLIC_APP_URL}/og.jpg`,
}
