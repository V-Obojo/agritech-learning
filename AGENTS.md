# AGENTS.md

## Purpose
Hackathon prototype: **Ovayi Farm** (a product of **Ovayi Foods**), a mobile-friendly learning companion for curious beginners in Nigeria. Home → area (Animal farming, Crop farming, Agro-processing) → subject (Fish farming is live; others coming soon) → a 5-topic fish path where 2 topics are live ("What is fish farming, and is it for me?" and "Water: do I have enough?"). Each live topic: lesson → source-grounded AI guide → inclusive activity → feedback → next steps, with progress saved on the device.

- Content layout: see `content/README.md` (`catalog.json` → `<subject>/path.json` → `<subject>/<topic>/{lesson.md,topic.json,activity.json}`).
- **Never hardcode** topic ids, subject/area names, chunk ids, people's names from scenarios, next-step ids or copy in `src/` (non-test). Read them from `content/`.

- Product spec: `agritech-learning-brainstorm.md` (Part 2 is the build scope).
- Outcomes and constraints: `GOALS.md`. Phase order and status: `PLANS.md`.
- The current phase's scope: `harness/build/phase-NN-*.md`. **Work only on the phase you were given.**

## Stack
Next.js 16 (App Router, `src/` dir) + TypeScript + Tailwind v4, npm, Node 24. `openai` SDK (Responses API) + `zod` v4. Tests: Vitest (unit, `src/**/*.test.ts`), Playwright (e2e, `tests/e2e/`, 375px mobile viewport).

## Commands
- `npm run check`: lint + typecheck + unit tests. **Run this freely inside the sandbox** during iteration.
- `npm run verify`: **the gate.** Runs `check` + production build. A phase is only done when this passes.
- **Known sandbox limitation (Windows, verified 2026-10-14):** `next build` fails *inside* the Codex sandbox (Turbopack "Failed to write app endpoint" / webpack `EPERM mkdir` under `.next/`). This is an environment issue, not a code bug; don't change code or config to work around it. Iterate with `npm run check`, then request approval to run `npm run verify` (and `npm run test:e2e`) **outside the sandbox**. If you can't escalate, record it in the build log and let the human run it.
- `npm run test`: unit tests only (always mock mode).
- `npm run test:e2e`: Playwright; builds and starts the app on port 3100 in mock mode.
- `npm run dev`: local dev server.
- If a command cannot run in the sandbox, record the exact error in `harness/build-log.md` as a blocker. Do not guess the result.

## Hard rules
1. **Never invent agricultural facts.** The guide and feedback may only use text from `content/` chunks, and must cite chunk ids. Unsupported questions get an honest limitation plus a next step from `content/pathway.json`.
2. **`content/` is read-only.** Read it; never edit it. If content seems wrong or missing, log it in the build log as a question for the human.
3. **Tests never call the network.** `GUIDE_MODE=mock` in all tests. Live mode only runs when `GUIDE_MODE=live` and `OPENAI_API_KEY` are both set.
4. **Never read, print, or edit `.env.local`** or any secret. Use `.env.example` for documenting variables.
5. **No new dependencies and no network installs.** Everything needed is installed. If you believe a package is required, stop and ask.
6. **No Google/remote fonts or external assets.** Builds must work offline; the layout already uses the system font stack.
7. Small, reviewable diffs. No unrelated refactors. Keep files that belong to other phases untouched.
8. **Stop at the phase boundary.** Do not start the next phase.
9. **Approval required for** commits, pushes, branch changes, deleting files outside the phase scope, and any external writes.
10. Low-bandwidth first: no images or heavy client libraries; keep pages light and readable on a small phone.

## Phase workflow
1. Read `AGENTS.md`, `GOALS.md`, the phase file, and the last entries of `harness/build-log.md`.
2. Implement toward the phase acceptance criteria; write tests alongside.
3. Run `npm run check` in the sandbox; fix the first failing check, then repeat. When green, run `npm run verify` with escalation (see Commands).
4. Append an entry to `harness/build-log.md` (template inside). Use real command results only.
5. Set the phase status in `PLANS.md` (`Complete` only if every acceptance criterion has evidence).
6. Stop and summarize: what changed, evidence, limitations, open questions.

## Conventions
- Server-only code (content loading, OpenAI calls) lives under `src/lib/` and is imported only by route handlers or server components.
- Validate every API request and every model response with zod.
- API errors return JSON `{ error: string }` with a sensible status code.
- Naming: kebab-case files, camelCase functions, PascalCase components.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
