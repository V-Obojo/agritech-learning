# Phase 14: Full-journey E2E, performance, accessibility, docs

**Status:** Not started

## Source inputs
Everything from Phases 09–13, `GOALS.md` (success conditions), `README.md`, and `tests/e2e/**`.

## Objective
Prove the whole v2 product works end to end on desktop and mobile, tighten performance and accessibility, and make the repo ready to demo and deploy.

## In scope
1. **`journey.spec.ts`** (both projects, temp DB, mock guide):
   1. A new visitor lands on home → picks an intention → Animal farming → Fish farming hub.
   2. Topic 1: lesson, check, a guide question (citation), activity → feedback → next.
   3. Signs up mid-journey → progress is kept.
   4. Topic 2: the 3D lab completed (via the hotspot list + mode toggle) and a figure lightbox.
   5. Topic 3: the water sim + spot-the-signs completed.
   6. Topic 4: the pond builder completed.
   7. The dashboard shows 4 topics' progress, lab results, a streak ≥ 1, and the expected badges (ids from content). Customize the layout.
   8. Sign out → sign in → everything is still there.
   9. The theme toggle persists.
2. **Accessibility:**
   - Every interactive lab is operable by keyboard alone (add a keyboard-only e2e for the pond builder and spot-the-signs).
   - Labels on all controls, colour contrast ≥ 4.5:1 for text in both themes (check token pairs with a small unit test computing contrast), visible focus, `aria-live` on results.
   - Reduced motion is honoured.
3. **Performance:**
   - Confirm the 3D, chart and lab chunks load only where used (network assertions).
   - Images are served via `next/image` with `sizes`.
   - The home page's JS stays lean. Record the build output's First Load JS per route in the build log and note any route over ~250 kB with the reason.
4. **Error and empty states:**
   - a friendly `error.tsx` and `not-found.tsx` in the design system
   - offline/failed guide requests show a retry
   - DB unavailable → auth pages show a friendly error, while learning still works as a guest
5. **README rewrite:**
   - product overview (Ovayi Farm by Ovayi Foods) with feature list and screenshots (from `test-results` copied into `docs/screenshots/`, a few small PNGs)
   - setup (`npm install`, `.env.local` variables, the commands to create `NEXTAUTH_SECRET`, `npm run db:migrate`, `npm run dev`)
   - mock vs live guide
   - accounts and data
   - labs
   - content editing (link `content/README.md`)
   - credits and licenses (media CC BY-SA/CC0/PD; link `/credits`)
   - testing
   - **Deploy to Vercel + Turso** step by step: create a Turso DB, get the URL and token, set the env vars in Vercel, run the migrations against Turso, deploy
   - known limitations: no email reset, so contact the admin; content sourced but not expert-reviewed is an internal note only, so mention it in the README, not the UI
6. **Final cleanup:** remove dead code from earlier phases (e.g. the unused draft-banner component), make sure `.gitignore` covers `data/`, `test-results/` and `.env*.local`, and make sure no secrets are tracked.

## Non-goals
New features or content. Actually deploying (the human does that with guidance).

## Acceptance criteria
- `npm run test:e2e` passes on both projects, including `journey.spec.ts` and the keyboard specs.
- The contrast unit test passes for both themes.
- `npm run verify` passes.
- The README covers every point above; `git ls-files` shows no `.env.local`, `data/` or db files.

## Required evidence
The e2e summary, the First Load JS table, the contrast results, and a README checklist in `harness/build-log.md`; final `PLANS.md` statuses.

## Stop condition
Stop after the acceptance criteria are verified. The human handles the push and deploy.
