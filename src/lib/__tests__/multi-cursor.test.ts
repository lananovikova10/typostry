import { applyBackspace } from "../multi-cursor"

describe("applyBackspace", () => {
  it("shifts later cursors by the length of a deleted selection", () => {
    const state = {
      primaryCursorId: "a",
      cursors: [
        { id: "a", start: 0, end: 3 }, // selects "abc"
        { id: "b", start: 6, end: 6 }, // caret before "f"
      ],
    }

    const { newText, newState } = applyBackspace(state, "abc def")

    expect(newText).toBe(" df")
    expect(newState.cursors.map((c) => [c.start, c.end])).toEqual([
      [0, 0],
      [2, 2],
    ])
  })

  it("does not shift later cursors for a caret at the start of the text", () => {
    const state = {
      primaryCursorId: "a",
      cursors: [
        { id: "a", start: 0, end: 0 },
        { id: "b", start: 2, end: 2 },
      ],
    }

    const { newText, newState } = applyBackspace(state, "abc")

    expect(newText).toBe("ac")
    expect(newState.cursors.map((c) => c.start)).toEqual([0, 1])
  })
})
