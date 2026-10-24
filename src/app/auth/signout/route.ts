import { NextRequest, NextResponse } from "next/server"

import { requireTrustedRequest } from "@/lib/api-security"
import { isCloudEnabled } from "@/lib/supabase/config"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// POST only, so link prefetching can never sign anyone out
export async function POST(request: NextRequest) {
  const forbidden = requireTrustedRequest(request)
  if (forbidden) return forbidden

  if (isCloudEnabled) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()
  }

  return NextResponse.redirect(new URL("/", request.nextUrl.origin), {
    status: 303,
  })
}
