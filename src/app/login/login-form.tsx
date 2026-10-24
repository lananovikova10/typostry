"use client"

import { FormEvent, useState } from "react"
import { Github, Mail } from "lucide-react"

import { getBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

interface LoginFormProps {
  next: string
}

export function LoginForm({ next }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Built from the current origin so Netlify deploy previews work too
  const redirectUrl = (path: string) =>
    `${window.location.origin}${path}?next=${encodeURIComponent(next)}`

  const handleEmailSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const { error } = await getBrowserClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectUrl("/auth/confirm") },
    })

    setIsSubmitting(false)
    if (error) {
      setError(error.message)
    } else {
      setSentTo(email)
    }
  }

  const handleGitHubSignIn = async () => {
    setError(null)
    const { error } = await getBrowserClient().auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: redirectUrl("/auth/callback") },
    })
    if (error) setError(error.message)
  }

  if (sentTo) {
    return (
      <div className="rounded-md border p-4 text-sm" role="status">
        <p className="font-medium">Check your email</p>
        <p className="mt-1 text-muted-foreground">
          We sent a sign-in link to <span className="font-medium">{sentTo}</span>.
        </p>
        <Button
          variant="link"
          className="mt-2 h-auto p-0"
          onClick={() => setSentTo(null)}
        >
          Use a different email
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGitHubSignIn}
        data-testid="login-github"
      >
        <Github className="mr-2 h-4 w-4" />
        Continue with GitHub
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleEmailSignIn} className="space-y-3">
        <Input
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-label="Email address"
          data-testid="login-email"
        />
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
          data-testid="login-email-submit"
        >
          <Mail className="mr-2 h-4 w-4" />
          {isSubmitting ? "Sending link…" : "Email me a sign-in link"}
        </Button>
      </form>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
