import { WELCOME_MARKDOWN } from "@/config/welcome-document"
import { saveToLocalStorage } from "@/lib/auto-save"
import { safeNextPath } from "@/lib/auth/safe-next"
import {
  areDocumentBackupsSuspended,
  clearAllDocumentBackups,
  listBackupDocumentIds,
  readDocumentBackup,
  suspendAndClearDocumentBackups,
  writeDocumentBackup,
} from "@/lib/documents/backup"
import {
  getPendingDraft,
  rememberDraftDecision,
} from "@/lib/documents/import-draft"
import { saveDocumentContent } from "@/lib/documents/repository"
import { deriveTitle, normalizeTitle, titleFromFileName } from "@/lib/documents/title"

describe("safeNextPath", () => {
  it("keeps in-app paths", () => {
    expect(safeNextPath("/d/123?x=1#top")).toBe("/d/123?x=1#top")
    expect(safeNextPath("/")).toBe("/")
  })

  it.each([
    "//evil.com",
    "/a/..//evil.example",
    "/a/../\\evil.example",
    "/\\evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "evil.com",
    "",
    null,
    undefined,
  ])("rejects %p", (value) => {
    expect(safeNextPath(value)).toBe("/")
  })
})

describe("titles", () => {
  it("uses the first H1", () => {
    expect(deriveTitle("intro\n# My notes\n## Sub")).toBe("My notes")
  })

  it("ignores H2 and falls back", () => {
    expect(deriveTitle("## Only a subheading", "Imported draft")).toBe("Imported draft")
  })

  it("clamps and defaults", () => {
    expect(normalizeTitle("   ")).toBe("Untitled")
    expect(normalizeTitle("a".repeat(300))).toHaveLength(200)
  })

  it("strips markdown extensions from file names", () => {
    expect(titleFromFileName("notes.md")).toBe("notes")
    expect(titleFromFileName("README.markdown")).toBe("README")
  })
})

describe("document backups", () => {
  beforeEach(() => localStorage.clear())

  it("round-trips and clears all backups", () => {
    writeDocumentBackup("a", "hello", 3)
    writeDocumentBackup("b", "world", null)
    localStorage.setItem("unrelated", "x")

    expect(readDocumentBackup("a")).toMatchObject({ content: "hello", baseVersion: 3 })
    expect(listBackupDocumentIds().sort()).toEqual(["a", "b"])

    clearAllDocumentBackups()
    expect(listBackupDocumentIds()).toEqual([])
    expect(localStorage.getItem("unrelated")).toBe("x")
  })
})

describe("getPendingDraft", () => {
  beforeEach(() => localStorage.clear())

  it("ignores the welcome text", () => {
    saveToLocalStorage(WELCOME_MARKDOWN)
    expect(getPendingDraft("user-1")).toBeNull()
  })

  it("offers a real draft once per user and draft", () => {
    saveToLocalStorage("# Draft\nsome text")
    const draft = getPendingDraft("user-1")
    expect(draft?.content).toBe("# Draft\nsome text")

    rememberDraftDecision("user-1", draft!)
    expect(getPendingDraft("user-1")).toBeNull()
    expect(getPendingDraft("user-2")).not.toBeNull()
  })
})

/** Minimal stand-in for the supabase-js query builder */
function createFakeSupabase({
  updateResult,
  selectResult,
}: {
  updateResult: { data: unknown; error: unknown }
  selectResult?: { data: unknown; error: unknown }
}) {
  const builder = (result: { data: unknown; error: unknown }) => {
    const chain: Record<string, unknown> = {}
    for (const method of ["update", "select", "eq", "order", "limit"]) {
      chain[method] = jest.fn(() => chain)
    }
    chain.maybeSingle = jest.fn(async () => result)
    return chain
  }

  const from = jest.fn()
  from.mockReturnValueOnce(builder(updateResult))
  if (selectResult) from.mockReturnValueOnce(builder(selectResult))
  return { from } as never
}

describe("saveDocumentContent", () => {
  const remoteRow = {
    id: "doc-1",
    title: "Doc",
    content: "theirs",
    version: 5,
    updated_at: "2026-10-24T10:00:00.000Z",
  }

  it("returns the new version on success", async () => {
    const supabase = createFakeSupabase({
      updateResult: { data: { version: 4, updated_at: remoteRow.updated_at }, error: null },
    })
    await expect(saveDocumentContent(supabase, "doc-1", "mine", 3)).resolves.toMatchObject({
      ok: true,
      version: 4,
    })
  })

  it("reports a conflict when the server has a newer version", async () => {
    const supabase = createFakeSupabase({
      updateResult: { data: null, error: null },
      selectResult: { data: remoteRow, error: null },
    })
    const result = await saveDocumentContent(supabase, "doc-1", "mine", 3)
    expect(result).toMatchObject({
      ok: false,
      reason: "conflict",
      remote: { content: "theirs", version: 5 },
    })
  })

  it("treats an identical remote copy as saved", async () => {
    const supabase = createFakeSupabase({
      updateResult: { data: null, error: null },
      selectResult: { data: { ...remoteRow, content: "mine" }, error: null },
    })
    await expect(saveDocumentContent(supabase, "doc-1", "mine", 3)).resolves.toMatchObject({
      ok: true,
      version: 5,
    })
  })

  it("reports deleted documents", async () => {
    const supabase = createFakeSupabase({
      updateResult: { data: null, error: null },
      selectResult: { data: null, error: null },
    })
    await expect(saveDocumentContent(supabase, "doc-1", "mine", 3)).resolves.toEqual({
      ok: false,
      reason: "deleted",
    })
  })

  it("maps network failures to offline", async () => {
    const supabase = createFakeSupabase({
      updateResult: { data: null, error: { message: "TypeError: Failed to fetch" } },
    })
    await expect(saveDocumentContent(supabase, "doc-1", "mine", 3)).resolves.toMatchObject({
      ok: false,
      reason: "offline",
    })
  })
})

// Runs last: suspension lasts for the rest of the page (module) lifetime
describe("suspendAndClearDocumentBackups", () => {
  it("clears backups and ignores later writes (sign-out)", () => {
    localStorage.clear()
    writeDocumentBackup("a", "hello", 1)
    suspendAndClearDocumentBackups()
    writeDocumentBackup("a", "written by beforeunload", 1)
    expect(listBackupDocumentIds()).toEqual([])
    expect(areDocumentBackupsSuspended()).toBe(true)
  })
})
