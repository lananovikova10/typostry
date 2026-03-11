"use client"

import { useEffect } from "react"

import Link from "next/link"

import { Button } from "@/components/ui/button"

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-xl flex-col items-center space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Something went wrong
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Try refreshing the page, or return home if the problem persists.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button onClick={reset}>Try again</Button>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
