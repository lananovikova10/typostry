import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  // Client-side environment variables schema
  client: {
    NEXT_PUBLIC_APP_URL: z.string().min(1),
    NEXT_PUBLIC_GITLAB_REPO_URL: z.string().optional(),
    NEXT_PUBLIC_GITLAB_TOKEN: z.string().optional(),
    NEXT_PUBLIC_UNSPLASH_ACCESS_KEY: z.string().optional(),
  },
  // Server-side environment variables schema
  server: {
    UNSPLASH_ACCESS_KEY: z.string().optional(),
    UNSPLASH_SECRET_KEY: z.string().optional(),
  },
  // Runtime environment values
  runtimeEnv: {
    // Client-side variables
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_GITLAB_REPO_URL: process.env.NEXT_PUBLIC_GITLAB_REPO_URL,
    NEXT_PUBLIC_GITLAB_TOKEN: process.env.NEXT_PUBLIC_GITLAB_TOKEN,
    NEXT_PUBLIC_UNSPLASH_ACCESS_KEY:
      process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY,
    // Server-side variables
    UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
    UNSPLASH_SECRET_KEY: process.env.UNSPLASH_SECRET_KEY,
  },
  // Add validation and error messages
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})
