import { notFound } from "next/navigation"

import { getDocument } from "@/lib/documents/repository"
import { documentIdSchema } from "@/lib/documents/schemas"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { DocumentWorkspace } from "@/components/documents/document-workspace"

interface DocumentPageProps {
  params: Promise<{ id: string }>
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id } = await params
  if (!documentIdSchema.safeParse(id).success) notFound()

  // RLS hides other users' documents, so they look like missing ones
  const supabase = await createServerSupabaseClient()
  const document = await getDocument(supabase, id)
  if (!document) notFound()

  return <DocumentWorkspace key={document.id} document={document} />
}
