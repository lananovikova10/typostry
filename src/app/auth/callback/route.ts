import { NextRequest, NextResponse } from "next/server"

import { safeNextPath } from "@/lib/auth/safe-next"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// OAuth (PKCE) redirect target: exchanges the one-time code for a session cookie
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const next = safeNextPath(searchParams.get("next"))

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(new URL("/auth/error", origin))
}
