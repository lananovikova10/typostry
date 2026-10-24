"use client"

import { useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, LogIn, LogOut } from "lucide-react"

import {
  clearAllDocumentBackups,
  listBackupDocumentIds,
} from "@/lib/documents/backup"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/components/auth/auth-provider"

export function UserMenu() {
  const { user, isCloudEnabled } = useAuth()
  const pathname = usePathname()
  const signOutFormRef = useRef<HTMLFormElement>(null)

  if (!isCloudEnabled) return null

  if (!user) {
    const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : ""
    return (
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="h-8 flex-shrink-0 px-2"
        data-testid="sign-in-button"
      >
        <Link href={`/login${next}`}>
          <LogIn className="mr-1.5 h-4 w-4" />
          Sign in
        </Link>
      </Button>
    )
  }

  const handleSignOut = () => {
    const hasUnsyncedChanges = listBackupDocumentIds().length > 0
    if (
      hasUnsyncedChanges &&
      !window.confirm(
        "Some changes haven't reached the server yet and will be lost if you sign out. Sign out anyway?"
      )
    ) {
      return
    }
    // This may be a shared machine: don't leave document copies behind
    clearAllDocumentBackups()
    signOutFormRef.current?.requestSubmit()
  }

  const initial = (user.email ?? "?").charAt(0).toUpperCase()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0 rounded-full"
            aria-label="Account menu"
            data-testid="user-menu"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initial}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="truncate font-normal">
            <span className="block text-xs text-muted-foreground">Signed in as</span>
            <span className="block truncate">{user.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/">
              <FileText className="mr-2 h-4 w-4" />
              My documents
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={handleSignOut}
            data-testid="sign-out"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <form
        ref={signOutFormRef}
        action="/auth/signout"
        method="post"
        className="hidden"
      />
    </>
  )
}
