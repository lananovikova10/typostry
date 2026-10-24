import { act, renderHook } from "@testing-library/react"

import { DocumentStore, SaveResult } from "@/lib/documents/types"
import { useDocumentPersistence } from "@/hooks/use-document-persistence"

function createStore(
  save: (content: string, baseVersion: number | null) => Promise<SaveResult>
) {
  return {
    kind: "cloud",
    autosaveDelayMs: 1000,
    maxWaitMs: 5000,
    save: jest.fn(save),
    readBackup: jest.fn(() => null),
    writeBackup: jest.fn(),
    clearBackup: jest.fn(),
  } satisfies DocumentStore
}

const ok = (version: number): SaveResult => ({ ok: true, version, savedAt: Date.now() })

function renderPersistence(store: DocumentStore, content = "v1") {
  return renderHook(
    ({ content }) =>
      useDocumentPersistence({
        store,
        content,
        initialContent: "v1",
        initialVersion: 1,
      }),
    { initialProps: { content } }
  )
}

describe("useDocumentPersistence", () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it("does not save the initial content", async () => {
    const store = createStore(async () => ok(2))
    renderPersistence(store)
    await act(async () => {
      jest.advanceTimersByTime(5000)
    })
    expect(store.save).not.toHaveBeenCalled()
  })

  it("debounces edits and sends the base version", async () => {
    const store = createStore(async () => ok(2))
    const { result, rerender } = renderPersistence(store)

    rerender({ content: "v2" })
    expect(result.current.status).toBe("dirty")
    rerender({ content: "v3" })

    await act(async () => {
      jest.advanceTimersByTime(999)
    })
    expect(store.save).not.toHaveBeenCalled()

    await act(async () => {
      jest.advanceTimersByTime(1)
    })
    expect(store.save).toHaveBeenCalledTimes(1)
    expect(store.save).toHaveBeenCalledWith("v3", 1)
    expect(result.current.status).toBe("saved")
  })

  it("saves during continuous typing once maxWait is reached", async () => {
    const store = createStore(async () => ok(2))
    const { rerender } = renderPersistence(store)

    for (let i = 0; i < 6; i++) {
      rerender({ content: `typing ${i}` })
      await act(async () => {
        jest.advanceTimersByTime(900)
      })
    }

    expect(store.save).toHaveBeenCalledTimes(1)
  })

  it("keeps one save in flight and follows up with the latest content", async () => {
    let resolveFirst: (value: SaveResult) => void = () => {}
    const store = createStore(
      jest
        .fn()
        .mockImplementationOnce(
          () => new Promise<SaveResult>((resolve) => (resolveFirst = resolve))
        )
        .mockImplementation(async () => ok(3))
    )
    const { result, rerender } = renderPersistence(store)

    rerender({ content: "v2" })
    act(() => {
      void result.current.flush()
    })
    rerender({ content: "v3" })
    act(() => {
      void result.current.flush()
    })
    expect(store.save).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveFirst(ok(2))
    })

    expect(store.save).toHaveBeenCalledTimes(2)
    expect(store.save).toHaveBeenLastCalledWith("v3", 2)
    expect(result.current.status).toBe("saved")
  })

  it("pauses on conflict and can overwrite the remote version", async () => {
    const remote = {
      id: "doc",
      title: "Doc",
      content: "theirs",
      version: 7,
      updatedAt: new Date().toISOString(),
    }
    const store = createStore(
      jest
        .fn()
        .mockResolvedValueOnce({ ok: false, reason: "conflict", remote })
        .mockResolvedValue(ok(8))
    )
    const { result, rerender } = renderPersistence(store)

    rerender({ content: "mine" })
    await act(async () => {
      await result.current.flush()
    })
    expect(result.current.status).toBe("conflict")
    expect(result.current.conflict).toEqual(remote)

    // Autosave is paused while the conflict is open
    rerender({ content: "mine, more" })
    await act(async () => {
      jest.advanceTimersByTime(5000)
    })
    expect(store.save).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.overwriteRemote()
    })
    expect(store.save).toHaveBeenLastCalledWith("mine, more", 7)
    expect(result.current.status).toBe("saved")
  })

  it("accepting the remote copy returns its content without saving", async () => {
    const remote = {
      id: "doc",
      title: "Doc",
      content: "theirs",
      version: 7,
      updatedAt: new Date().toISOString(),
    }
    const store = createStore(async () => ({ ok: false, reason: "conflict", remote }))
    const { result, rerender } = renderPersistence(store)

    rerender({ content: "mine" })
    await act(async () => {
      await result.current.flush()
    })

    let accepted: string | null = null
    act(() => {
      accepted = result.current.acceptRemote()
    })
    expect(accepted).toBe("theirs")
    expect(store.clearBackup).toHaveBeenCalled()

    rerender({ content: "theirs" })
    await act(async () => {
      jest.advanceTimersByTime(5000)
    })
    expect(store.save).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe("saved")
  })

  it("backs up while offline and retries when back online", async () => {
    const store = createStore(
      jest
        .fn()
        .mockResolvedValueOnce({ ok: false, reason: "offline" })
        .mockResolvedValue(ok(2))
    )
    const { result, rerender } = renderPersistence(store)

    rerender({ content: "v2" })
    await act(async () => {
      await result.current.flush()
    })
    expect(result.current.status).toBe("offline")
    expect(store.writeBackup).toHaveBeenCalledWith("v2", 1)

    await act(async () => {
      window.dispatchEvent(new Event("online"))
    })
    expect(store.save).toHaveBeenCalledTimes(2)
    expect(result.current.status).toBe("saved")
  })

  it("stops saving a deleted document", async () => {
    const store = createStore(async () => ({ ok: false, reason: "deleted" }))
    const { result, rerender } = renderPersistence(store)

    rerender({ content: "v2" })
    await act(async () => {
      await result.current.flush()
    })
    expect(result.current.status).toBe("deleted")

    rerender({ content: "v3" })
    await act(async () => {
      jest.advanceTimersByTime(60000)
    })
    expect(store.save).toHaveBeenCalledTimes(1)
  })

  it("flushes pending changes on unmount", async () => {
    const store = createStore(async () => ok(2))
    const { rerender, unmount } = renderPersistence(store)

    rerender({ content: "v2" })
    await act(async () => {
      unmount()
    })
    expect(store.save).toHaveBeenCalledWith("v2", 1)
  })
})
