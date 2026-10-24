import type { NextRequest } from "next/server"

// jsdom has no Response global, so stub the bits of next/server we use
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}))

const requestFrom = (ip: string) =>
  ({
    headers: {
      get: (name: string) => (name === "x-forwarded-for" ? ip : null),
    },
  }) as unknown as NextRequest

describe("requireRateLimit", () => {
  const options = { key: "test", maxRequests: 2, windowMs: 60_000 }

  // Fresh module per test: the limiter state lives at module level
  const loadModule = () => {
    let mod: typeof import("../api-security")
    jest.isolateModules(() => {
      mod = require("../api-security")
    })
    return mod!
  }

  it("limits each client separately", () => {
    const { requireRateLimit } = loadModule()

    expect(requireRateLimit(requestFrom("1.1.1.1"), options)).toBeNull()
    expect(requireRateLimit(requestFrom("1.1.1.1"), options)).toBeNull()
    expect(requireRateLimit(requestFrom("1.1.1.1"), options)?.status).toBe(429)
    expect(requireRateLimit(requestFrom("2.2.2.2"), options)).toBeNull()
  })

  it("rejects new clients instead of growing past the cap", () => {
    const { requireRateLimit } = loadModule()

    // Fill the table with 1000 clients that have all used a token,
    // so none of them is idle and pruning can't free a slot
    for (let i = 0; i < 1000; i++) {
      expect(requireRateLimit(requestFrom(`10.0.${i >> 8}.${i & 255}`), options)).toBeNull()
    }

    expect(requireRateLimit(requestFrom("9.9.9.9"), options)?.status).toBe(429)
    // Existing clients keep their own limits
    expect(requireRateLimit(requestFrom("10.0.0.0"), options)).toBeNull()
  })
})
