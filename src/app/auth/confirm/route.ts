import { NextRequest, NextResponse } from "next/server"
import { EmailOtpType } from "@supabase/supabase-js"

import { safeNextPath } from "@/lib/auth/safe-next"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "email",
  "magiclink",
  "signup",
  "invite",
  "recovery",
  "email_change",
])

// Magic-link target. Supports the token_hash template (works in any browser)
// and the default PKCE link (works in the browser that requested it).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const code = searchParams.get("code")
  const next = safeNextPath(searchParams.get("next"))

  const supabase = await createServerSupabaseClient()

  if (tokenHash && type && EMAIL_OTP_TYPES.has(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })
    if (!error) return NextResponse.redirect(new URL(next, origin))
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(next, origin))
  }

  return NextResponse.redirect(new URL("/auth/error", origin))
}
