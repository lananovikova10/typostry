import { NextRequest, NextResponse } from "next/server"

import { isCloudEnabled } from "@/lib/supabase/config"
import { updateSession } from "@/lib/supabase/middleware"

function isProtectedPath(pathname: string): boolean {
  return pathname === "/d" || pathname.startsWith("/d/")
}

export async function middleware(request: NextRequest) {
  if (!isCloudEnabled) return NextResponse.next()

  const { pathname, search } = request.nextUrl
  const isProtected = isProtectedPath(pathname)
  const hasAuthCookie = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-"))

  // Guests without a session cookie don't need a round-trip to Supabase
  if (!hasAuthCookie && !isProtected) return NextResponse.next()

  const { response, userId } = await updateSession(request)

  if (isProtected && !userId) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.search = ""
    loginUrl.searchParams.set("next", `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|uploads/|images/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|md)$).*)",
  ],
}
