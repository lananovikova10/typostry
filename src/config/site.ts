import { env } from "@/env.mjs"
import { SiteConfig } from "@/types/site"

export const siteConfig: SiteConfig = {
  name: "typostry",
  author: "lananovikova10",
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
    author: "https://github.com/lananovikova10",
  },
  links: {
    github: "https://github.com/lananovikova10/typostry",
  },
  ogImage: `${env.NEXT_PUBLIC_APP_URL}/og.jpg`,
}
