# Phase 10: Accounts + database + progress sync

**Status:** Not started

## Source inputs
`AGENTS.md` (security rules), `GOALS.md`, `.env.example`, `src/lib/progress.ts`, `src/lib/metrics.ts`, `src/components/use-progress.ts`, `src/components/guide-panel.tsx`, the Phase 09 shell, and the next-auth v4 + drizzle docs in `node_modules`.

## Objective
Optional email/password accounts. A signed-in learner's progress, events and preferences live in the database and follow them across sessions. Guest progress merges into the account on sign-up and sign-in.

## In scope
1. **DB** (`src/lib/db/`):
   - Drizzle schema (SQLite via `@libsql/client`):
     - `users` (id text pk, email unique lowercased, name, password_hash, state nullable, intention nullable, theme nullable, created_at, updated_at)
     - `progress` (user_id pk/fk, data json text, updated_at)
     - `events` (id, user_id fk, name, details json text, created_at; index user_id+created_at)
     - `dashboard_prefs` (user_id pk/fk, widgets json text, updated_at)
     - `guide_history` (id, user_id fk, subject_id, topic_id, question, answer, supported, citations json, created_at)
   - Cascade deletes on user deletion.
   - `drizzle.config.ts`, migrations in `drizzle/`, and a `getDb()` reading `DATABASE_URL` / `DATABASE_AUTH_TOKEN`.
   - Auto-create the `data/` folder for `file:` URLs.
   - Tests use a temp file DB with migrations applied.
2. **Auth** (`src/lib/auth/`, `src/app/api/auth/[...nextauth]/route.ts`):
   - next-auth v4 with the Credentials provider (email + password, bcryptjs compare) and JWT session strategy.
   - The session exposes `user.id`, `name` and `email` only.
   - `NEXTAUTH_SECRET` comes from env. If it's missing in development, fail with a clear message telling the human to set it (never generate or print one).
3. **Sign-up API** `POST /api/auth/signup`:
   - zod: name 1–60, email, password ≥ 8 with at least one letter + one number, optional state/intention.
   - A duplicate email gets a generic 409 message.
   - bcryptjs hash (cost 10–12).
   - A simple in-memory rate limit per IP: max 10 per 10 minutes, returning 429.
4. **Pages:**
   - `/signup` and `/signin`: centred auth cards matching the design system, with inline zod validation messages, show/hide password, loading states, and a link between the two.
   - `/signin` has "Forgot password?" which opens text: "Contact the admin to reset your password: <supportContact>" (from `catalog.json`, as a `mailto:` link).
   - After auth, redirect to `callbackUrl` or `/dashboard`.
   - `/account` (protected):
     - edit name, state (a Nigerian states select; the list can live in code as plain geography data), intention, theme
     - change password (requires current password)
     - delete account (confirm by typing "DELETE"); this deletes all of the user's rows and signs out
     - sign out
   - The nav shows the avatar initials + menu (Dashboard, Account, Sign out) when signed in.
5. **Route protection** for `/dashboard` and `/account`: unauthenticated → `/signin?callbackUrl=…`. Use the Next 16 convention documented in `node_modules/next/dist/docs/` (middleware/proxy or a server-side session check in the layout).
6. **Progress sync** (keep the public API of `src/lib/progress.ts` and the hooks unchanged for consumers):
   - When signed in, the store hydrates from `GET /api/me/progress` and debounce-saves (≈1s) with `PUT /api/me/progress` (zod-validated, size-limited).
   - When signed out, it uses localStorage exactly as now.
   - Initial server progress is passed through a provider so signed-in pages have no empty flash.
   - **Merge on sign-up/sign-in** (pure function `mergeProgress(guest, account)`):
     - per topic: `completed` = OR, `viewed` = OR
     - `checkAnswers` = union, preferring the account's answer on conflict
     - `guideQuestionsAsked` = max
     - `activity` = the one with feedback, else the most recent
     - `labs` = per lab best score / completed OR
     - `intention` = account's ?? guest's
     - `lastPath` = the most recent

     After merging, clear guest localStorage progress.
   - Extend the progress schema with `labs: Record<labId, { completed: boolean; score: number | null; data: unknown; updatedAt: string }>` (default `{}`), ready for Phases 12–13.
   - Fix the bypass in `guide-panel.tsx` (it calls `loadProgress()` directly) to go through the store API.
7. **Events sync:**
   - When signed in, `recordEvent` also batches events to `POST /api/me/events`. Guest events merge on sign-in (deduplicated by name+at).
   - Guide Q&A for signed-in users is stored in `guide_history` via `POST /api/me/guide-history`, called client-side after an answer. Keep `/api/guide` stateless.
8. **API conventions:** every `/api/me/*` route requires a session, scopes all queries by `session.user.id`, validates with zod, and returns `{ error }` JSON on failure.

## Non-goals
Dashboard UI (Phase 11), OAuth, email sending, admin tools.

## Acceptance criteria
- Unit tests:
  - password policy + hashing round-trip
  - signup validation (good/bad cases)
  - duplicate email 409
  - rate limit 429
  - `mergeProgress` (each rule)
  - `/api/me/progress` rejects an unauthenticated request (401) and never returns another user's data (two-user test against the temp DB)
  - account deletion removes all rows
- E2E (both projects, temp DB):
  1. A guest completes part of topic 1 → signs up → the dashboard placeholder loads → progress is kept (merged).
  2. Sign out → progress view shows guest state → sign in → account progress is back.
  3. Visiting `/dashboard` signed out redirects to `/signin`.
  4. "Forgot password?" shows the admin contact.
  5. A wrong password shows the generic error.
  6. Profile name change is reflected in the nav initials.
- No password, hash or secret appears in any log output during tests (spot check: grep the test output).
- `npm run verify` and `npm run test:e2e` pass.
- `.env.example` documents all variables. Add a README section "Set up accounts locally" with the commands the human runs to create `NEXTAUTH_SECRET` and run migrations. The human edits `.env.local`; you don't.

## Required evidence
Test summaries, the migration file names, and the e2e summary in `harness/build-log.md`.

## Stop condition
Stop after the acceptance criteria are verified. Do not begin Phase 11.
