# Authentication and cloud documents

Signed-in users get server-side documents stored in Supabase Postgres. Guests keep the original behavior: a localStorage draft plus opening and saving local files. If the Supabase env vars are not set, the app runs guest-only and hides every auth UI.

## Architecture

```
Browser ── supabase-js (user JWT) ──► Supabase Postgres (RLS)   autosave, create, rename, delete
   │
   └─► Next server components ── @supabase/ssr cookies ──► Supabase   initial document + list
       src/middleware.ts        refreshes the session cookie, guards /d/*
       /auth/callback           OAuth (PKCE) code exchange
       /auth/confirm            magic-link verification (token_hash or code)
       /auth/signout            POST only, same-origin check
```

- **Security boundary.** Security is enforced in the database, not in Next. `supabase/migrations/` defines:
  - RLS policies that limit every query to the caller's own rows.
  - Column grants: clients can only write `title` and `content`.
  - A size limit (1 MB per document) and a cap of 1000 documents per user.
- **Optimistic concurrency.** Each save is `UPDATE … WHERE version = <base>`, and `version` increases only when the content changes. A save that matches no row is reported as either a **conflict** (the editor offers Keep mine, Load latest or Save a copy) or **deleted**.
- **Autosave.** `src/hooks/use-document-persistence.ts` is shared by guest mode (`createLocalStore`) and cloud mode (`createCloudStore`). It:
  - waits 1.5 s after the last keystroke and never more than 10 s between saves;
  - runs one save at a time;
  - retries with backoff while offline and right away when the connection returns;
  - flushes when the tab is hidden or the editor unmounts;
  - in cloud mode, warns on `beforeunload` while changes are unsaved.
- **Offline safety.** Unsynced cloud edits are copied to `localStorage["typostry_doc_backup:<id>"]`. On reload the editor offers to restore them. Sign-out clears these copies.
- **Routes:**
  - `/`: guests get the editor. Signed-in users are redirected to their most recently edited document, or see an empty state if they have none.
  - `/d/[id]`: a document page, with the document list in a side panel.
  - `/login`: email magic link or GitHub.
- **Importing a guest draft.** After the first sign-in, a guest's localStorage draft can be imported as a new document. The welcome text is ignored, and the question is asked once per draft.

Main code:
- `src/lib/supabase/`: Supabase clients.
- `src/lib/documents/`: repository, stores, backups and titles.
- `src/components/documents/`: panel, workspace, save status, dialogs.
- `src/components/auth/`: auth provider and user menu.

## Local setup

1. Start Supabase locally. This needs Docker.
   ```bash
   npx supabase start        # applies supabase/migrations, prints API URL + publishable key
   npx supabase test db      # runs supabase/tests (RLS checks)
   ```
2. Add the printed values to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```
3. Run `npm run dev` and sign in with any email. Mailpit catches the magic-link mail at http://localhost:54324.
4. Optional: enable GitHub login. Export `SUPABASE_AUTH_GITHUB_CLIENT_ID` and `SUPABASE_AUTH_GITHUB_SECRET` before `supabase start`. The OAuth app's callback URL is `http://127.0.0.1:54321/auth/v1/callback`.

After a schema change, regenerate the types:
```bash
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

## Production (Supabase project + Netlify)

1. Create a Supabase project and run `npx supabase link` and then `npx supabase db push`.
2. In **Authentication → URL configuration**:
   - Set **Site URL** to `https://<your-site>`.
   - Add these redirect URLs:
     - `https://<your-site>/auth/callback`
     - `https://<your-site>/auth/confirm**`
     - `https://deploy-preview-*--<netlify-site>.netlify.app/**`
3. In **Authentication → Email templates → Magic link**, paste `supabase/templates/magic_link.html`. Its link format lets magic links open in a different browser from the one that requested them. With the default template, links only work in the browser that requested them.
4. In **Authentication → Providers → GitHub**, add the OAuth app's client ID and secret. Those credentials live only in Supabase.
5. In **Netlify → Environment variables**, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for both Production and Deploy Previews.

Never put the service-role key in the app or behind a `NEXT_PUBLIC_` name. The app doesn't need it.

## Known follow-ups

- `/api/upload` still writes images to `public/uploads`. That folder doesn't persist on Netlify, so uploads should move to a Supabase Storage bucket with per-user folders.
- Supabase Realtime could warn about conflicts as they happen, instead of when the next save runs.
- Add an end-to-end Cypress test against local Supabase: sign in through the Mailpit API, then import, edit, reload, conflict and offline.
