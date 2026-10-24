import { createBrowserClient } from "@supabase/ssr"
import { SupabaseClient } from "@supabase/supabase-js"

import { getSupabaseConfig } from "./config"
import { Database } from "./database.types"

export type TypedSupabaseClient = SupabaseClient<Database>

let browserClient: TypedSupabaseClient | null = null

/**
 * Browser Supabase client. Auth is kept in cookies so server components and
 * middleware see the same session.
 */
export function getBrowserClient(): TypedSupabaseClient {
  if (!browserClient) {
    const { url, key } = getSupabaseConfig()
    browserClient = createBrowserClient<Database>(url, key)
  }

  return browserClient
}
