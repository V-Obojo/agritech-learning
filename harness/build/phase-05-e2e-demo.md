# Phase 05: E2E tests, metrics, demo readiness

**Status:** Not started

## Source inputs
`AGENTS.md`, `GOALS.md` (success conditions), `playwright.config.ts`, Phase 01–04 code.

## Objective
Prove the full learning loop works on a phone-sized screen in mock mode, add simple local metrics, and make the repo demo-ready.

## In scope
- **Metrics** `src/lib/metrics.ts` (client): append events to localStorage `agri-events-v1` (try/catch): `intention_chosen`, `lesson_viewed`, `check_answered`, `guide_asked`, `guide_unsupported`, `help_requested`, `activity_submitted`, `activity_completed`, `would_return`. Show a small "Your session" summary on `/next` (completed activity yes/no, check score x/3, would return).
- **Playwright tests** in `tests/e2e/` (mock mode, 375px):
  1. `full-loop.spec.ts`: choose "I'm just curious" → lesson → answer the check → ask "Why does the dry season matter?" → answer shows a `wa-03` citation → activity "observe" with the example text → feedback visible → `/next` shows the next step; choose "yes" to come back.
  2. `no-farm-access.spec.ts`: fictional path completes with feedback.
  3. `stuck-help.spec.ts`: submit "idk" → hint shown → "Stuck?" shows the authored hint → resubmit a real answer → completed.
  4. `unsupported.spec.ts`: ask about medicine dosage → "not covered" message + next step, no citations.
  5. `resume.spec.ts`: progress survives a reload, and "Continue where you left off" appears on `/`.
  6. A no-horizontal-scroll check at 375px on each page.
- **README.md**: what it is, the draft-content warning, setup (`npm install`, copy `.env.example` → `.env.local`, `npm run dev`), mock vs live mode, scripts, the demo script (the 5 steps above), project structure, content editing guide (link `content/README.md`), known limitations (draft content, no live reminders, retention unproven), future possibilities.
- Fix any bugs the e2e tests reveal (stay within the existing design).

## Non-goals
New features, deployment, real reminder delivery.

## Acceptance criteria
- `npm run test:e2e` passes (all 6 specs).
- `npm run verify` passes.
- README covers the points above.

## Required evidence
Playwright summary (specs passed) + the verify summary in `harness/build-log.md`; the final `PLANS.md` status.

## Stop condition
Stop after the acceptance criteria are verified. The human handles deploy and push.
