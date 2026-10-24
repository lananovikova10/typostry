import { env } from "@/env.mjs"

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

/**
 * Cloud features (sign-in, server-side documents) are only available when
 * Supabase is configured. Without it the editor runs in guest-only mode.
 */
export const isCloudEnabled = Boolean(supabaseUrl && supabaseKey)

export function getSupabaseConfig(): { url: string; key: string } {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    )
  }

  return { url: supabaseUrl, key: supabaseKey }
}
