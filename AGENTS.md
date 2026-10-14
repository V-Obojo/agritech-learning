# AGENTS.md

## Purpose
**Ovayi Farm** (a product of **Ovayi Foods**) is a responsive, animated learning web app for curious beginners in Nigeria. The journey: Home → area (Animal farming, Crop farming, Agro-processing) → subject (Fish farming is live; the others are coming soon) → a 5-topic fish path. Four topics are live:
- What is fish farming
- Meet the African catfish
- Water
- Space and setup options

Each live topic runs lesson (with zoomable photos and interactive **labs**) → source-grounded AI guide → activity → feedback → next steps. Guests can learn freely. Optional **accounts** save progress to a database and unlock a customizable **dashboard** with badges and streaks.

- Content layout: `content/README.md`. Covers `catalog.json`, `sources.json`, `media.json`, `labs.json`, `badges.json`, `<subject>/path.json` and `<subject>/<topic>/{lesson.md,topic.json,activity.json}`, plus the lesson directives `::figure <mediaId>` and `::lab <labId>`.
- **Never hardcode** any of these in `src/` (non-test); read them from `content/`:
  - topic, subject or area ids and names
  - chunk ids, lab ids, badge ids, media ids
  - people's names from scenarios
  - next-step ids, or any copy
- Product spec: `agritech-learning-brainstorm.md`. Outcomes: `GOALS.md`. Phase order and status: `PLANS.md`.
- The current phase's scope: `harness/build/phase-NN-*.md`. **Work only on the phase you were given.**

## Stack
- **Framework:** Next.js 16 (App Router, `src/` dir) + TypeScript, npm, Node 24.
- **Styling:** CSS custom-property design tokens in `globals.css`, with Tailwind v4 available.
- **Animation:** `motion` (Framer Motion).
- **3D:** `three` + `@react-three/fiber` + `@react-three/drei`.
- **Charts:** `recharts`.
- **Auth:** `next-auth` v4 (Credentials provider, JWT sessions), with `bcryptjs` for hashing.
- **Database:** `drizzle-orm` + `@libsql/client` (SQLite file locally via `DATABASE_URL`, Turso when deployed), with `drizzle-kit` for migrations.
- **AI:** `openai` (Responses API) and `zod` v4.
- **Tests:** Vitest (unit, `src/**/*.test.ts`) and Playwright (e2e in `tests/e2e/`, with desktop 1440px and mobile 375px projects).

## Commands
- `npm run check`: lint + typecheck + unit tests. **Run it freely inside the sandbox** during iteration.
- `npm run verify`: **the gate.** Runs `check` + the production build. A phase is only done when this passes.
- **Known sandbox limitation (Windows, verified 2026-10-14):** `next build` and Playwright fail *inside* the Codex sandbox (Turbopack "Failed to write app endpoint" / webpack `EPERM mkdir` under `.next/`). This is an environment issue, not a code bug, so don't change code or config to work around it. Iterate with `npm run check`, then request approval to run `npm run verify` and `npm run test:e2e` **outside the sandbox**. If you can't escalate, record that in the build log and let the human run them.
- `npm run test`: unit tests only (always mock mode, temp DB).
- `npm run test:e2e`: Playwright. It builds and starts the app on port 3100 in mock mode with a fresh temp DB.
- `npm run db:generate` / `npm run db:migrate`: Drizzle migrations (`drizzle/` folder).
- `npm run dev`: local dev server.
- If a command cannot run in the sandbox, record the exact error in `harness/build-log.md` as a blocker. Do not guess the result.

## Hard rules
1. **Never invent agricultural facts.** The guide, feedback and labs may only use text from `content/` and must cite chunk ids. Unsupported questions get an honest limitation plus a next step from the topic's `topic.json`. Simulators show their `exampleNote`.
2. **`content/` and `public/media/` are read-only.** Read them; never edit them. If content seems wrong or missing, log it in the build log as a question for the human.
3. **Tests never call the network.** All tests run with `GUIDE_MODE=mock`. Live mode only runs when `GUIDE_MODE=live` and `OPENAI_API_KEY` are both set. Tests use a throwaway SQLite file (e.g. `data/test-*.db`), never `data/ovayi.db`.
4. **Secrets:** never read, print, or edit `.env.local` or any secret. Never log passwords, password hashes, session tokens or `NEXTAUTH_SECRET`. Document variables in `.env.example` only.
5. **No new dependencies and no network installs.** Everything needed is installed. If you believe a package is required, stop and ask.
6. **No remote assets.** That means no Google/remote fonts, CDN scripts, remote images or remote 3D models. Everything is served locally, and the e2e fixture fails on external requests.
7. **Security basics for accounts:**
   - Hash passwords with bcryptjs.
   - Validate all input with zod.
   - Give generic auth error messages ("Email or password is incorrect").
   - Every `/api/me/*` route checks the session and only touches the signed-in user's rows.
   - Make delete-account actually delete the user's data.
8. **Performance:** 3D (`three`/r3f/drei), charts and labs are loaded lazily (`next/dynamic`, client-only) only on pages that use them. Images use `next/image` with width/height from `media.json`. Respect `prefers-reduced-motion`.
9. Small, reviewable diffs. No unrelated refactors. Keep files that belong to other phases untouched.
10. **Stop at the phase boundary.** Do not start the next phase.
11. **Approval required for** commits, pushes, branch changes, deleting files outside the phase scope, and any external writes.

## Responsive design rules
- Breakpoints: `sm` 640, `md` 768, `lg` 1024, `xl` 1280. The content container is max 1200px, with fluid padding (16px on phones, 32px on desktop).
- Desktop uses multi-column layouts. Lesson pages: a sticky table of contents (left), the lesson (centre), and a sticky guide panel (right) at ≥1280px. Phones collapse to one column, and the guide opens as a bottom sheet.
- Nothing scrolls sideways at 375px, 768px, 1280px or 1440px.
- Tap targets are at least 44px, with visible focus states and accessible labels.

## Phase workflow
1. Read `AGENTS.md`, `GOALS.md`, the phase file, and the last entries of `harness/build-log.md`.
2. Implement toward the phase acceptance criteria, writing tests alongside.
3. Run `npm run check` in the sandbox and fix the first failing check, then repeat. When it's green, run `npm run verify` with escalation.
4. Append an entry to `harness/build-log.md` using the template inside. Record real command results only.
5. Set the phase status in `PLANS.md`. Mark it `Complete` only if every acceptance criterion has evidence.
6. Stop and summarize: what changed, the evidence, limitations, and open questions.

## Conventions
- Server-only code (content loading, OpenAI calls, DB access, auth config) lives under `src/lib/` (e.g. `src/lib/db/`, `src/lib/auth/`). Only route handlers, server components or server actions import it.
- Validate every API request and every model response with zod.
- API errors return JSON `{ error: string }` with a sensible status code.
- Naming: kebab-case files, camelCase functions, PascalCase components.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
