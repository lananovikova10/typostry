import Link from "next/link"
import { redirect } from "next/navigation"

import { siteConfig } from "@/config/site"
import { safeNextPath } from "@/lib/auth/safe-next"
import { isCloudEnabled } from "@/lib/supabase/config"
import { getSessionUser } from "@/lib/supabase/server"
import { Icons } from "@/components/icons"

import { LoginForm } from "./login-form"

export const metadata = {
  title: "Sign in",
}

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next: rawNext } = await searchParams
  const next = safeNextPath(rawNext)

  if (!isCloudEnabled) redirect("/")

  const user = await getSessionUser()
  if (user) redirect(next)

  return (
    <main className="container py-10">
      <div className="mx-auto max-w-sm space-y-6">
        <Link href="/" className="flex items-center gap-3">
          <Icons.logo className="h-8 w-8 flex-shrink-0" />
          <span className="text-2xl font-semibold">{siteConfig.name}</span>
        </Link>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to keep your documents in the cloud and open them on any
            device.
          </p>
        </div>
        <LoginForm next={next} />
      </div>
    </main>
  )
}
