import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { SessionUser } from "@/lib/auth/types"

import { TypedSupabaseClient } from "./client"
import { getSupabaseConfig, isCloudEnabled } from "./config"
import { Database } from "./database.types"

/**
 * Supabase client for Server Components, Route Handlers and Server Actions.
 * Create a new one per request.
 */
export async function createServerSupabaseClient(): Promise<TypedSupabaseClient> {
  const cookieStore = await cookies()
  const { url, key } = getSupabaseConfig()

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The middleware refreshes the session instead.
        }
      },
    },
  })
}

/**
 * Returns the signed-in user, or null for guests (and when Supabase is not
 * configured). Claims are verified against the project's signing keys.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isCloudEnabled) return null

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims?.sub || claims.is_anonymous) return null

  return { id: claims.sub, email: claims.email ?? null }
}
