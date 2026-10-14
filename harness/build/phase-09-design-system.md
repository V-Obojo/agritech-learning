# Phase 09: Design system + responsive, animated shell

**Status:** Not started

## Source inputs
`AGENTS.md` (responsive rules), `GOALS.md`, `content/catalog.json`, the existing pages and components under `src/app/**` and `src/components/**`, `src/app/globals.css`, `playwright.config.ts`, and `tests/e2e/**`.

## Why
The app was built phone-first. `globals.css` line ~48 caps all content at `min(100%, 44rem)`, there is one 640px breakpoint, and there are no animations. The user demos on a laptop and wants a modern edtech look (Duolingo/Brilliant feel) that also works on phones.

## Objective
Every existing page looks polished and intentional at 1440px, 1280px, 768px and 375px. The pages are home, area, subject hub, coming-soon, topic lesson, activity, next and not-found. There are tasteful animations, a theme toggle, and a top navigation ready for later phases.

## In scope
1. **Design tokens** (`globals.css`, CSS custom properties, light + dark):
   - Brand green (primary) plus earthy soil/amber/cream accents (the current palette), refined.
   - A type scale (fluid `clamp()` headings), a spacing scale, radii, shadows, elevation, and z-index layers.
   - Container: `max-width: 1200px`, fluid padding.
   - **Theme:** follows `prefers-color-scheme` by default. A `data-theme` attribute on `<html>` overrides it. A toggle in the nav saves the choice to localStorage (Phase 10 also syncs it to the profile). Avoid a flash: set the attribute with a tiny inline script in the layout before paint.
2. **App shell** (`src/app/layout.tsx` + `src/components/site-nav.tsx`, `site-footer.tsx`):
   - **Top nav:** a wordmark ("Ovayi Farm" + small "by Ovayi Foods") plus Learn (home → areas), Labs (`/labs`, a placeholder page for now with "coming in this build"), Dashboard (links to `/dashboard`; a placeholder page until Phase 11), Sign in / Sign up buttons (placeholder routes until Phase 10), and the theme toggle.
   - Sticky header with a subtle blur on scroll. On mobile, a hamburger opens a sheet menu.
   - **Footer:** product, parent, `supportContact`, links (Credits placeholder, Labs, Learn), © year. **Remove** the "No sign-up. Your progress stays on this device…" note.
3. **Page redesigns** (keep all existing behaviour and data flow; layout and styling change only):
   - **Home:**
     - A bold hero (product name as the single h1, tagline, pitch, primary CTA "Start learning" → animal-farming, secondary "Explore labs"). A decorative animated background made of CSS/SVG gradient blobs or waves; no images.
     - An intention picker as large selectable cards.
     - Area cards in a 3-column grid on desktop with hover lift (coming-soon areas muted with subject chips).
     - A "Continue where you left off" card.
     - **Remove the duplicate "by Ovayi Foods" eyebrow** in the hero. The parent name stays in the nav only.
   - **Area page:** a header band + a responsive subject-card grid (3–4 columns on desktop).
   - **Subject hub:**
     - Two columns on desktop: left, the intro + the path as a vertical timeline (numbered nodes connected by a line, status badges); right, a sticky side card with an overall progress ring (x of N live topics done), the intention + change, and the Start/Continue CTA.
     - **Fix the badge bug:** only the single next topic shows "Up next" (use the computed `next`; others show "Not started"). Today it's `subject-hub.tsx` ~line 20.
   - **Topic lesson:**
     - Desktop ≥1280px gets three columns: a sticky table of contents of chunk titles (left, highlights the current section on scroll); the lesson (centre); the sticky guide panel + Stuck? (right).
     - 768–1279px gets two columns (TOC collapses to a dropdown).
     - Phones get one column, with the guide as a floating "Ask the guide" button opening a bottom sheet.
     - Reading width ≤ 70ch. The understanding check renders as interactive option cards with instant feedback animation.
     - **Remove the draft banner** (delete `draft-banner.tsx` usage; nothing about "draft" or "not reviewed" anywhere in the UI).
     - **Directive lines** (`::figure …`, `::lab …`) must **not render as text**: render nothing for now (Phase 12 implements them). Do this in the chunk body renderer.
   - **Activity / next:** card-based layouts, two columns on desktop where sensible (e.g. path choice | answer + feedback), and animated feedback reveal.
4. **Motion** (`motion` package): page/section entrance fade-up with stagger, card hover lift, progress-ring and badge pop animations, and an animated check-answer state. Respect `prefers-reduced-motion` (no movement, instant states). Keep JS small: motion components only in client components where needed.
5. **Fix the Next.js "URL data during prerendering" dev warning** for `/[area]`, `/[area]/[subject]` and `/[area]/[subject]/[topic]` (plus `activity`/`next`). Read `node_modules/next/dist/docs/` for the recommended pattern with `cacheComponents` (e.g. move `await params` into a child inside `<Suspense>`, or the documented route-segment option). Pages must remain statically generated.
6. **Playwright projects:** `desktop-chromium` (1440×900) and `mobile-chromium` (375×812, existing). Update `tests/e2e/fixtures.ts` and the specs for intentional DOM/text changes. Keep test intent; update selectors deliberately (prefer roles/labels over classes). `no-horizontal-scroll.spec.ts` checks 375, 768, 1280 and 1440 on every page type.

7. **Content changed before this phase** (step V in PLANS.md): `meet-the-catfish` and `setup-options` are now **live** (4 of 5 topics live), lessons contain `::figure`/`::lab` lines, and new files exist (`media.json`, `labs.json`, `badges.json`). Existing unit/e2e tests that assume 2 live topics or specific counts will fail. Update them to derive their expectations from content where practical (the content itself is correct and read-only). The new topics must render through the existing content-driven pages, with the directives hidden.

## Non-goals
Auth, DB, dashboard content, labs/figures (directives just hidden), new content.

## Acceptance criteria
- `npm run verify` passes; `npm run test:e2e` passes on **both** projects.
- No horizontal scroll at 375/768/1280/1440 on home, area, hub, coming-soon, lesson, activity, next and not-found.
- The hub shows exactly one "Up next".
- Home has one "Ovayi Farm" h1 and no duplicated parent line in the hero.
- No "Draft learning material", "not yet reviewed" or "No sign-up. Your progress stays" text anywhere (add an e2e assertion).
- No `::figure`/`::lab` text visible on lesson pages (e2e assertion).
- The theme toggle switches and persists across reload; no theme flash on load.
- With `reducedMotion: 'reduce'` emulated, pages render without animation (e2e on one page).
- The dev console shows no "URL data during prerendering" error on the dynamic routes (record how you checked).
- Save Playwright screenshots of each page type at 1440 and 375 under `test-results/phase-09/` (gitignored) and list them in the build log.

## Required evidence
The verify + e2e summaries (both projects), the screenshot list, and how the prerender warning was verified, all in `harness/build-log.md`.

## Stop condition
Stop after the acceptance criteria are verified. Do not begin Phase 10.
