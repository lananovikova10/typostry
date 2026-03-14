import { NextRequest, NextResponse } from "next/server"

import { RateLimiter } from "@/lib/rate-limiter"

const RATE_LIMITERS = new Map<string, RateLimiter>()
const SAME_SITE_VALUES = new Set(["same-origin", "same-site"])
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
} as const

type HeaderInit = HeadersInit | undefined

interface RateLimitOptions {
  key: string
  maxRequests: number
  windowMs: number
  errorMessage?: string
}

function mergeHeaders(headers?: HeaderInit): Headers {
  const merged = new Headers(headers)
  for (const [key, value] of Object.entries(NO_STORE_HEADERS)) {
    merged.set(key, value)
  }
  return merged
}

function getRequestHostOrigin(request: NextRequest): string | null {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  if (!host) {
    return null
  }

  const protocol =
    request.headers.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https")

  return `${protocol}://${host}`
}

function getOrigin(value: string | null): string | null {
  if (!value) {
    return null
  }

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function getAllowedOrigins(request: NextRequest): Set<string> {
  const allowedOrigins = new Set<string>()
  const appUrlOrigin = getOrigin(process.env.NEXT_PUBLIC_APP_URL ?? null)
  const requestOrigin = getRequestHostOrigin(request)
  const extraOrigins =
    process.env.INTERNAL_API_ALLOWED_ORIGINS
      ?.split(",")
      .map((value) => getOrigin(value.trim()))
      .filter((value): value is string => Boolean(value)) ?? []

  if (appUrlOrigin) {
    allowedOrigins.add(appUrlOrigin)
  }

  if (requestOrigin) {
    allowedOrigins.add(requestOrigin)
  }

  for (const origin of extraOrigins) {
    allowedOrigins.add(origin)
  }

  return allowedOrigins
}

function isTrustedRequest(request: NextRequest): boolean {
  const internalApiKey = process.env.INTERNAL_API_KEY
  const providedInternalApiKey = request.headers.get("x-internal-api-key")

  if (
    internalApiKey &&
    providedInternalApiKey &&
    providedInternalApiKey === internalApiKey
  ) {
    return true
  }

  const allowedOrigins = getAllowedOrigins(request)
  const origin = getOrigin(request.headers.get("origin"))
  const refererOrigin = getOrigin(request.headers.get("referer"))

  if (origin && allowedOrigins.has(origin)) {
    return true
  }

  if (refererOrigin && allowedOrigins.has(refererOrigin)) {
    return true
  }

  const fetchSite = request.headers.get("sec-fetch-site")
  return fetchSite ? SAME_SITE_VALUES.has(fetchSite) : false
}

function getClientAddress(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim()
  }

  return request.headers.get("x-real-ip") ?? "unknown"
}

export function noStoreJson(
  body: unknown,
  init?: ResponseInit
): NextResponse<unknown> {
  return NextResponse.json(body, {
    ...init,
    headers: mergeHeaders(init?.headers),
  })
}

export function rejectRequest(
  message: string,
  status: number
): NextResponse<unknown> {
  return noStoreJson({ error: message }, { status })
}

export function requireTrustedRequest(
  request: NextRequest
): NextResponse<unknown> | null {
  if (isTrustedRequest(request)) {
    return null
  }

  return rejectRequest("Forbidden", 403)
}

export function requireRateLimit(
  request: NextRequest,
  options: RateLimitOptions
): NextResponse<unknown> | null {
  const clientAddress = getClientAddress(request)
  const limiterKey = `${options.key}:${clientAddress}`
  let limiter = RATE_LIMITERS.get(limiterKey)

  if (!limiter) {
    limiter = new RateLimiter({
      maxRequests: options.maxRequests,
      windowMs: options.windowMs,
      errorMessage: options.errorMessage,
    })
    RATE_LIMITERS.set(limiterKey, limiter)
  }

  if (limiter.tryRequest()) {
    return null
  }

  return rejectRequest(
    options.errorMessage ?? "Too many requests",
    429
  )
}
