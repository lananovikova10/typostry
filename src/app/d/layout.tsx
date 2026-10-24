import { redirect } from "next/navigation"

import { listDocuments } from "@/lib/documents/repository"
import {
  createServerSupabaseClient,
  getSessionUser,
} from "@/lib/supabase/server"
import { DocumentsProvider } from "@/components/documents/documents-provider"
import { DocumentsShell } from "@/components/documents/documents-shell"

interface DocumentsLayoutProps {
  children: React.ReactNode
}

export default async function DocumentsLayout({
  children,
}: DocumentsLayoutProps) {
  // The middleware already redirects guests; this is defense in depth
  const user = await getSessionUser()
  if (!user) redirect("/login")

  const supabase = await createServerSupabaseClient()
  const documents = await listDocuments(supabase)

  return (
    <DocumentsProvider initialDocuments={documents}>
      <DocumentsShell>{children}</DocumentsShell>
    </DocumentsProvider>
  )
}
