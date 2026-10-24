import { TypedSupabaseClient } from "@/lib/supabase/client"

import { normalizeTitle } from "./title"
import { DocumentSnapshot, DocumentSummary, SaveResult } from "./types"

/**
 * All document queries live here. Every call runs with the caller's session,
 * so Row-Level Security limits it to their own rows.
 */

interface DocumentRow {
  id: string
  title: string
  content: string
  version: number
  updated_at: string
}

function toSnapshot(row: DocumentRow): DocumentSnapshot {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    version: row.version,
    updatedAt: row.updated_at,
  }
}

export async function listDocuments(
  supabase: TypedSupabaseClient
): Promise<DocumentSummary[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false })

  if (error) throw error
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
  }))
}

export async function getLatestDocumentId(
  supabase: TypedSupabaseClient
): Promise<string | null> {
  const { data, error } = await supabase
    .from("documents")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data?.id ?? null
}

export async function getDocument(
  supabase: TypedSupabaseClient,
  id: string
): Promise<DocumentSnapshot | null> {
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, content, version, updated_at")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return data ? toSnapshot(data) : null
}

export async function createDocument(
  supabase: TypedSupabaseClient,
  { title, content }: { title: string; content: string }
): Promise<DocumentSnapshot> {
  const { data, error } = await supabase
    .from("documents")
    .insert({ title: normalizeTitle(title), content })
    .select("id, title, content, version, updated_at")
    .single()

  if (error) throw error
  return toSnapshot(data)
}

export async function renameDocument(
  supabase: TypedSupabaseClient,
  id: string,
  title: string
): Promise<DocumentSummary> {
  const { data, error } = await supabase
    .from("documents")
    .update({ title: normalizeTitle(title) })
    .eq("id", id)
    .select("id, title, updated_at")
    .single()

  if (error) throw error
  return { id: data.id, title: data.title, updatedAt: data.updated_at }
}

export async function deleteDocument(
  supabase: TypedSupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("documents").delete().eq("id", id)
  if (error) throw error
}

function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true
  if (error instanceof TypeError) return true
  const message = (error as { message?: string } | null)?.message ?? ""
  return /failed to fetch|network|load failed/i.test(message)
}

/**
 * Saves content only if the server still has `baseVersion`
 * (optimistic concurrency). The conditional UPDATE is atomic, so two tabs
 * can never silently overwrite each other.
 */
export async function saveDocumentContent(
  supabase: TypedSupabaseClient,
  id: string,
  content: string,
  baseVersion: number
): Promise<SaveResult> {
  try {
    const { data, error } = await supabase
      .from("documents")
      .update({ content })
      .eq("id", id)
      .eq("version", baseVersion)
      .select("version, updated_at")
      .maybeSingle()

    if (error) {
      return {
        ok: false,
        reason: isNetworkError(error) ? "offline" : "error",
        error,
      }
    }

    if (data) {
      return {
        ok: true,
        version: data.version,
        savedAt: new Date(data.updated_at).getTime(),
      }
    }

    // No row matched: either it was deleted or someone saved a newer version
    const remote = await getDocument(supabase, id)
    if (!remote) return { ok: false, reason: "deleted" }
    if (remote.content === content) {
      return {
        ok: true,
        version: remote.version,
        savedAt: new Date(remote.updatedAt).getTime(),
      }
    }
    return { ok: false, reason: "conflict", remote }
  } catch (error) {
    return {
      ok: false,
      reason: isNetworkError(error) ? "offline" : "error",
      error,
    }
  }
}
