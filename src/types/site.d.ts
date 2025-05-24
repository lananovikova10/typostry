export interface SiteConfig {
  name: string
  author: string
  description: string
  keywords: string[]
  url: {
    base: string
    author: string
  }
  links: {
    github: string
  }
  ogImage: string
}
