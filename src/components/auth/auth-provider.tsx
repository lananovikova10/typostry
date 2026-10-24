"use client"

import { createContext, useContext, useEffect } from "react"
import { useRouter } from "next/navigation"

import { SessionUser } from "@/lib/auth/types"
import { getBrowserClient } from "@/lib/supabase/client"

interface AuthContextValue {
  user: SessionUser | null
  isCloudEnabled: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isCloudEnabled: false,
})

interface AuthProviderProps extends AuthContextValue {
  children: React.ReactNode
}

/**
 * Exposes the signed-in user (resolved on the server in the root layout) and
 * re-renders server components when the session changes in another tab.
 */
export function AuthProvider({
  user,
  isCloudEnabled,
  children,
}: AuthProviderProps) {
  const router = useRouter()

  useEffect(() => {
    if (!isCloudEnabled) return

    const {
      data: { subscription },
    } = getBrowserClient().auth.onAuthStateChange((event, session) => {
      const changed =
        (event === "SIGNED_IN" && session?.user.id !== user?.id) ||
        (event === "SIGNED_OUT" && user !== null)
      if (changed) router.refresh()
    })

    return () => subscription.unsubscribe()
  }, [isCloudEnabled, user, router])

  return (
    <AuthContext.Provider value={{ user, isCloudEnabled }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
