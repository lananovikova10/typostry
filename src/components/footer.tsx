import Link from "next/link"
import { Github, Coffee, Mail } from "lucide-react"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* About Section */}
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">{siteConfig.name}</h3>
            <p className="text-sm text-muted-foreground">
              {siteConfig.description}
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              <Link
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-md",
                  "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                  "transition-colors"
                )}
                aria-label="GitHub Repository"
              >
                <Github className="h-4 w-4" />
              </Link>
              <Link
                href="https://buymeacoffee.com/ij5tnsb"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-md",
                  "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                  "transition-colors"
                )}
                aria-label="Buy Me a Coffee"
              >
                <Coffee className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Resources Section */}
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">Resources</h3>
            <nav className="flex flex-col gap-2">
              <Link
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Repository
              </Link>
              <Link
                href={`${siteConfig.links.github}/blob/main/LICENSE`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                MIT License
              </Link>
              <Link
                href={`${siteConfig.links.github}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Report an Issue
              </Link>
            </nav>
          </div>

          {/* Contact Section */}
          <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">Contact</h3>
            <div className="flex flex-col gap-2">
              <Link
                href={siteConfig.url.author}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {siteConfig.author}
              </Link>
              <Link
                href={`${siteConfig.links.github}/discussions`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Discussions
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 flex flex-col gap-2 border-t pt-8 text-center text-sm text-muted-foreground md:flex-row md:justify-between">
          <p>
            © {currentYear} {siteConfig.author}. All rights reserved.
          </p>
          <p>
            Licensed under the{" "}
            <Link
              href={`${siteConfig.links.github}/blob/main/LICENSE`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              MIT License
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
