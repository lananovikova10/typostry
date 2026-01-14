# AGENTS: Quick Guide
- Stack: Next.js 14 + TypeScript; Tailwind + shadcn/ui; prefer destructured imports.
- Setup: Node 18+; `npm install` (package-lock present); copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_APP_URL=http://localhost:3000` plus optional Unsplash/GitLab/Hugging Face keys.
- Core workflows: `npm run dev`, `npm run build`, `npm test` (Jest), `npm run cypress:run` for e2e when relevant.
- Editor guardrails: keep markdown/preview parity (emoji, Mermaid, JS blocks, templates, grammar check); avoid blocking the editor during async calls.
- Quality: add small, focused tests for new logic; lint/format when configured; keep diffs minimal; update docs/help text when behavior changes; validate with `npm run build` before handoff.
- UX/resilience: keep UI responsive; handle browsers without File System Access gracefully.
- Security: no secrets in repo; use `.env.local` for local-only values.
