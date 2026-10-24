import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

import { getSupabaseConfig } from "./config"
import { Database } from "./database.types"

/**
 * Refreshes the auth session cookie and reports who is signed in.
 * Always return the `response` it gives back so refreshed cookies reach the browser.
 */
export async function updateSession(
  request: NextRequest
): Promise<{ response: NextResponse; userId: string | null }> {
  let response = NextResponse.next({ request })
  const { url, key } = getSupabaseConfig()

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
        Object.entries(headers).forEach(([headerName, value]) =>
          response.headers.set(headerName, value)
        )
      },
    },
  })

  // Do not run code between createServerClient and getClaims: it is what
  // triggers the token refresh.
  const { data } = await supabase.auth.getClaims()

  return { response, userId: data?.claims?.sub ?? null }
}
