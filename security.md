# Security Audit

Date: 2026-03-13

## Status

The original critical and high-severity findings from the first audit have been remediated in code.

Current result: no confirmed exposed provider keys remain in source, env examples, docs, or rebuilt `.next` output, and the sensitive API routes now have request validation, origin checks, and server-side rate limiting.

## What Was Fixed

### 1. Exposed keys removed from client paths and docs

Resolved.

Evidence:
- Browser-side provider calls now proxy through internal routes instead of reading provider keys directly:
  - `src/lib/unsplash/api.ts:34-62`
  - `src/lib/huggingface/index.ts:26-57`
- Sensitive variables were removed from the public env surface:
  - `src/env.mjs:4-26`
- Env examples and setup docs now keep Hugging Face, Grazie, and Unsplash credentials server-side:
  - `.env.example:1-23`
  - `README.md:99-119`
  - `docs/GITLAB_TEMPLATES.md:1-79`
  - `src/lib/unsplash/README.md:1-16`
- The tracked `.env.local` file was scrubbed locally and removed from git tracking during remediation.

Verification:
- Grep rerun for `NEXT_PUBLIC_HF_API_KEY`, `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY`, `NEXT_PUBLIC_GITLAB_TOKEN`, `NEXT_PUBLIC_GRAZIE_TOKEN`, and `GRAZIE_DEV_TOKEN` returned no matches in `README.md`, `docs`, `src`, `.env.example`, `.env.local`, or `.next`.
- Grep rerun for the previously exposed live token values also returned no matches in the repo or rebuilt `.next`.

### 2. Sensitive API routes now enforce request checks

Resolved for the current app model.

Evidence:
- Shared request guard and no-store response handling:
  - `src/lib/api-security.ts:5-168`
- Route protection added to all sensitive routes:
  - `src/app/api/nlc/complete/route.ts:10-119`
  - `src/app/api/summarize/route.ts:11-56`
  - `src/app/api/unsplash/random/route.ts:11-52`
  - `src/app/api/upload/route.ts:67-144`

What changed:
- Same-origin or explicitly allowed-origin enforcement
- Optional internal API key support for non-browser callers
- Server-side per-route rate limiting
- `Cache-Control: no-store` on these responses

### 3. Missing input validation was replaced with Zod schemas

Resolved.

Evidence:
- Central schemas:
  - `src/lib/api-schemas.ts:1-43`
- Request parsing now uses `safeParse` in each sensitive route:
  - `src/app/api/nlc/complete/route.ts:27-39`
  - `src/app/api/summarize/route.ts:27-39`
  - `src/app/api/unsplash/random/route.ts:27-39`
  - `src/app/api/upload/route.ts:91-123`

What changed:
- Strict allowlists for NLC, summarization, and Unsplash inputs
- Upload metadata validation with bounded file size
- Rejection of unexpected request keys in strict schemas

### 4. Upload validation is materially stronger

Resolved.

Evidence:
- `src/app/api/upload/route.ts:13-65`
- `src/app/api/upload/route.ts:107-133`

What changed:
- Only JPEG, PNG, GIF, and WebP are accepted
- File size capped at 5 MB
- Uploaded bytes are sniffed server-side and must match the declared MIME type
- Filenames are randomized with `crypto.randomUUID()`

### 5. The markdown preview XSS path was removed

Resolved.

Evidence:
- Code blocks are rebuilt with DOM nodes and `textContent`, not interpolated HTML:
  - `src/hooks/useCodeBlocks.ts:9-22`
  - `src/hooks/useCodeBlocks.ts:70-83`
  - `src/hooks/useCodeBlocks.ts:102-117`
- The JavaScript execution hook was removed from the preview path entirely.

Result:
- The previous `innerHTML` reconstruction bug for attacker-controlled code text is gone.
- The previous `new Function(...)` execution path is no longer present in `src`.

## Validation Run

Focused tests:
- `npm test -- --runInBand src/lib/__tests__/api-schemas.test.ts src/lib/__tests__/provider-proxy.test.ts`
- Result: passed

Production build:
- `npm run build`
- Result: passed

Security-focused verification:
- Re-ran grep for the previously exposed GitLab, Hugging Face, and Grazie token values
- Re-ran grep for the old `NEXT_PUBLIC_*` secret variables
- Re-ran grep for the removed client-side execution/XSS markers

## Residual Risks

### 1. Previously exposed third-party credentials still need external rotation

Severity: Operational follow-up

The codebase no longer exposes those keys, but any credentials that were previously committed or bundled should still be rotated or revoked in the provider dashboards. That cannot be completed from inside this repository.

### 2. Route protection is app-level, not user-identity auth

Severity: Low for current scope

The current application has no user accounts, sessions, or payment flows. For that reason, the routes were locked down with trusted-origin checks and server-side throttling rather than a user-auth system.

If this app later handles authenticated user records, multi-tenant data, or payments, it should move to:
- real user/session auth
- durable shared rate limiting
- CSRF protection tied to the auth model

### 3. Rate limiting is in-memory

Severity: Low

`src/lib/api-security.ts:143-168` uses an in-memory limiter. That is acceptable for a single-instance deployment, but not for horizontally scaled or serverless multi-instance abuse resistance. If deployment architecture changes, move this to a shared store such as Redis.

## Conclusion

The original report is no longer accurate as a statement of current code risk. After the remediation pass, the codebase is materially cleaner:

- no confirmed exposed API keys remain in code, docs, or built assets
- sensitive routes are guarded and validated
- upload handling is constrained
- the preview-layer XSS issue is removed

Remaining work is operational rather than code-level: rotate any credentials that were exposed before this fix set was applied.
