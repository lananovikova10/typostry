import Link from "next/link"

import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Sign-in failed",
}

export default function AuthErrorPage() {
  return (
    <main className="container py-10">
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Sign-in failed</h1>
        <p className="text-muted-foreground">
          The sign-in link is invalid or has expired. Please request a new one.
        </p>
        <Button asChild>
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    </main>
  )
}
