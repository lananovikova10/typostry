import { redirect } from "next/navigation"

import { siteConfig } from "@/config/site"
import { WELCOME_MARKDOWN } from "@/config/welcome-document"
import { getLatestDocumentId } from "@/lib/documents/repository"
import {
  createServerSupabaseClient,
  getSessionUser,
} from "@/lib/supabase/server"
import { SparklesText } from "@/components/ui/sparkles-text"
import { UserMenu } from "@/components/auth/user-menu"
import { DocumentsProvider } from "@/components/documents/documents-provider"
import { DocumentsShell } from "@/components/documents/documents-shell"
import { EmptyDocuments } from "@/components/documents/empty-documents"
import { Icons } from "@/components/icons"
import { MarkdownEditor } from "@/components/markdown-editor"

export default async function Home() {
  const user = await getSessionUser()

  // Signed-in users land on their most recently edited document
  if (user) {
    const supabase = await createServerSupabaseClient()
    const latestDocumentId = await getLatestDocumentId(supabase)
    if (latestDocumentId) redirect(`/d/${latestDocumentId}`)

    return (
      <DocumentsProvider initialDocuments={[]}>
        <DocumentsShell>
          <EmptyDocuments />
        </DocumentsShell>
      </DocumentsProvider>
    )
  }

  // Guests: unchanged local-only editor
  return (
    <main className="container py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col items-start gap-4 text-left">
          <div className="flex items-center gap-3">
            <Icons.logo className="h-10 w-10 flex-shrink-0" />
            <SparklesText
              text={siteConfig.name}
              className="text-3xl font-semibold sm:text-4xl md:text-5xl leading-none"
              sparklesCount={12}
              colors={{ first: "#9E7AFF", second: "#FE8BBB" }}
            />
          </div>
          <p className="leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            A fully-featured markdown editor with preview functionality
          </p>
        </div>

        <MarkdownEditor
          initialValue={WELCOME_MARKDOWN}
          toolbarEndSlot={<UserMenu />}
        />
      </div>
    </main>
  )
}
