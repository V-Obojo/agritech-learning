# PROMPTS.md

Ready-to-paste `/goal` texts, one per phase. How to run a phase:

1. Open a terminal in `C:\Users\king\Desktop\hackathon` and run `codex`. Accept the project-trust prompt the first time.
2. Start a fresh session for each phase (`/new`), so context stays small.
3. Paste the phase's goal **as one message** starting with `/goal`.
4. When Codex stops, review `harness/build-log.md` and the diff. If happy, commit (or ask Codex to commit), then go to the next phase.

If `/goal` is unavailable, paste the same text without `/goal` as a normal prompt.

**Expect one approval prompt per phase:** `next build` (inside `npm run verify`) and Playwright cannot run inside the Codex Windows sandbox, so Codex iterates with `npm run check` and asks you to approve running `npm run verify` / `npm run test:e2e` outside the sandbox. Approve those; deny anything else unexpected (network installs, edits to `content/`, reading `.env.local`).

---

## Phase 1: Content loader

```
/goal Complete Phase 01 exactly as specified in harness/build/phase-01-content-loader.md.
Outcome: typed, zod-validated loaders for everything in content/, an integrity checker, and a placeholder home page.
Verify: `npm run verify` passes, including new unit tests for parseLesson, the loaders (10 chunks wa-01..wa-10) and integrity checks (catching an unknown source id and an unknown chunk reference via in-memory fixtures).
Constraints: follow AGENTS.md hard rules. Do not modify content/, do not read .env.local, no new dependencies, no network.
Boundaries: src/app/page.tsx, public/ default SVGs, src/lib/content/**, tests.
Iteration: after each change run `npm run check` and fix the first failing check; when green, run `npm run verify` outside the sandbox (ask for approval).
Blocked: if verify cannot run in the sandbox or the spec is ambiguous, stop and record the exact error/question in harness/build-log.md.
Done: append an evidence entry to harness/build-log.md, set Phase 1 to Complete in PLANS.md and the build-log table, summarize, and stop. Do not start Phase 02.
```

## Phase 2: Guide API

```
/goal Complete Phase 02 exactly as specified in harness/build/phase-02-guide-api.md.
Outcome: POST /api/guide returns {answer, supported, citations, nextStep, mode}, grounded only in lesson chunks, with post-validation of citations and an honest unsupported fallback from content/pathway.json. Live mode uses the OpenAI Responses API (responses.parse + zodTextFormat); mock mode is deterministic.
Verify: `npm run verify` passes, with mock-mode tests for: a dry-season question citing wa-03; a medicine-dosage question returning supported:false + next step talk-extension; post-validation converting invalid citations (wa-99) to unsupported; 400 on invalid input. Route tested by calling the exported POST with a Request.
Constraints: AGENTS.md hard rules. Do not modify content/, do not read .env.local, no new dependencies, no test may call the network. Phase 1 tests stay green.
Boundaries: src/lib/guide/**, src/app/api/guide/**, tests.
Iteration: run `npm run check` after each change and fix the first failing check; when green, run `npm run verify` outside the sandbox (ask for approval). Check node_modules/next/dist/docs for route-handler rules before writing the route.
Blocked: if verify cannot run or a decision is missing, stop and log it in harness/build-log.md.
Done: append evidence to harness/build-log.md, update PLANS.md + log table, summarize, and stop. Do not start Phase 03.
```

## Phase 3: Feedback + stuck help

```
/goal Complete Phase 03 exactly as specified in harness/build/phase-03-feedback-help.md.
Outcome: POST /api/feedback gives rubric-based feedback for the observe, questions and fictional paths (completed:false + authored hint for too-short answers); POST /api/help returns the authored stuck hint plus an optional guide explanation. Both work in mock mode; live mode uses structured outputs with post-validation.
Verify: `npm run verify` passes, with mock-mode tests for each path using the activity.json examples, a fictional/no-farm-access answer, the "idk" stuck case, /api/help with and without a question, and 400s on invalid bodies.
Constraints: AGENTS.md hard rules. Do not modify content/, do not read .env.local, no new deps, no network in tests. Phase 1-2 tests stay green.
Boundaries: src/lib/feedback/**, src/app/api/feedback/**, src/app/api/help/**, small reuse-only changes in src/lib/guide/**, tests.
Iteration: run `npm run check` after each change and fix the first failing check; when green, run `npm run verify` outside the sandbox (ask for approval).
Blocked: stop and log in harness/build-log.md.
Done: append evidence to harness/build-log.md, update PLANS.md + log table, state that the backend checkpoint is ready, summarize, and stop. Do not start Phase 04.
```

## Backend checkpoint (human, not Codex)

1. Put your key in `.env.local` (copy `.env.example`), set `GUIDE_MODE=live` and `OPENAI_MODEL=<a model your key can use>`.
2. Run `npm run dev`, then try the guide and feedback endpoints (e.g. with the PowerShell snippet in README, or wait for the UI).
3. Commit, then create and push the public repo (only `.env.example` must be tracked).

## Phase 4: Learning UI

```
/goal Complete Phase 04 exactly as specified in harness/build/phase-04-learning-ui.md.
Outcome: a phone-first flow / → /lesson (draft banner, sources, understanding check, guide panel, Stuck? help) → /activity (3 inclusive paths, feedback card, Stuck? help) → /next (next steps, demo-only reminder opt-in, would-you-return), with progress saved in localStorage and resumed after reload.
Verify: `npm run verify` passes, including unit tests for src/lib/progress.ts (round-trip, corrupted JSON, localStorage throwing). Pages render at 375px without horizontal scroll.
Constraints: AGENTS.md hard rules. Do not modify content/ or the API contracts, do not read .env.local, no new deps, no images or remote assets, client components must not import server-only modules.
Boundaries: src/app/** pages and components, src/components/**, src/lib/progress.ts, tests.
Iteration: run `npm run check` after each change and fix the first failing check; when green, run `npm run verify` outside the sandbox (ask for approval).
Blocked: stop and log in harness/build-log.md.
Done: append evidence to harness/build-log.md, update PLANS.md + log table, summarize, and stop. Do not start Phase 05.
```

## Phase 5: E2E + demo readiness

```
/goal Complete Phase 05 exactly as specified in harness/build/phase-05-e2e-demo.md.
Outcome: local metrics events + a session summary on /next, six Playwright specs (full loop, no-farm-access, stuck→help, unsupported question, resume after reload, no horizontal scroll at 375px), and a demo-ready README.
Verify: `npm run test:e2e` passes all specs and `npm run verify` passes.
Constraints: AGENTS.md hard rules. Mock mode only, no new deps, do not modify content/, do not read .env.local. Fix bugs the tests reveal without redesigning.
Boundaries: tests/e2e/**, src/lib/metrics.ts, minimal fixes in src/**, README.md.
Iteration: run the failing spec first, fix, then rerun the full suites.
Blocked: if Playwright cannot launch in the sandbox, record the exact error in harness/build-log.md and stop.
Done: append evidence to harness/build-log.md, update PLANS.md + log table, summarize, and stop.
```

---

# Restructure: Ovayi Farm (phases 6–8)

Content was restructured by Claude (step R in PLANS.md). Run these in order, one fresh Codex session (`/new`) each, approving between phases.

## Phase 6: Multi-topic content model + APIs

```
/goal Complete Phase 06 exactly as specified in harness/build/phase-06-multi-topic-model.md.
Outcome: content loaders, integrity checks, the guide, feedback and help APIs work for any live topic described in content/ (catalog.json → <subject>/path.json → <subject>/<topic>/{lesson.md,topic.json,activity.json}), with topicId on every API, and no topic ids, names or copy hardcoded in src/ (non-test).
Verify: `npm run check` then `npm run verify` (outside the sandbox, ask approval) pass, with unit tests for: catalog (3 areas), fish path (5 topics, 2 live), both topics loading (8 wf- and 10 wa- chunks), integrity clean + fixture failures, guide citing wf-05 for "What do I need to start fish farming?" and wa-03 for the dry-season question, unsupported fallback per topic, 400 for unknown/coming-soon topics, feedback for reflect/fictional (Tunde) and the existing water paths, and help per topic. The grep in the phase file finds hardcoded names only in tests.
Constraints: AGENTS.md hard rules. content/ is read-only (it is already correct; npm run check failing at the start is expected). No new deps, no network, don't read .env.local. Keep UI changes minimal (only what's needed to compile against the new loaders). E2E may stay red until Phase 08.
Boundaries: src/lib/content/**, src/lib/guide/**, src/lib/feedback/**, src/app/api/**, minimal call-site fixes in src/app/** and src/components/**, unit tests.
Iteration: run `npm run check` after each change and fix the first failing check; when green, run `npm run verify` outside the sandbox (ask for approval).
Blocked: if content seems wrong or a decision is missing, stop and log it in harness/build-log.md.
Done: append evidence to harness/build-log.md, update PLANS.md + log table, summarize, and stop. Do not start Phase 07.
```

## Phase 7: Ovayi Farm navigation + per-topic UI

```
/goal Complete Phase 07 exactly as specified in harness/build/phase-07-navigation-ui.md.
Outcome: the phone-first journey Home (Ovayi Farm by Ovayi Foods, intention question, 3 area cards) → /[area] → /[area]/[subject] (fish hub with intro, 5-topic path and status, or a coming-soon page) → /[area]/[subject]/[topic] lesson → /activity → /next for every live topic, statically generated from content/, with breadcrumbs, progress v2 per topic (agri-progress-v2, lastPath resume), and the green + earthy palette. The old /lesson, /activity, /next pages are removed and the "first step for curious beginners" line is gone.
Verify: `npm run check` then `npm run verify` (outside the sandbox, ask approval) pass, including progress v2 unit tests and a generateStaticParams test; the manual smoke journey in the phase file passes in mock mode and is recorded in the build log.
Constraints: AGENTS.md hard rules. No hardcoded topic/subject names, routes or copy in src/ (read from content/). Don't modify content/ or the Phase 06 API contracts. No new deps, no images, no remote assets, don't read .env.local. Client components must not import server-only modules.
Boundaries: src/app/** (pages, layout, not-found, globals.css), src/components/**, src/lib/progress.ts, tests/manual/**, unit tests.
Iteration: run `npm run check` after each change and fix the first failing check; when green, run `npm run verify` outside the sandbox (ask for approval).
Blocked: stop and log in harness/build-log.md.
Done: append evidence to harness/build-log.md, update PLANS.md + log table, summarize, and stop. Do not start Phase 08.
```

## Phase 8: E2E + demo polish for the full journey

```
/goal Complete Phase 08 exactly as specified in harness/build/phase-08-journey-e2e.md.
Outcome: metrics events carry subjectId/topicId (plus area_opened, subject_opened, topic_opened), the 6 existing Playwright specs are updated to the new routes, a new navigation.spec.ts proves Home → Animal farming → Fish farming hub → topic 1 loop (wf-05 citation, Tunde path) → hub shows Done → water topic (wa-03 citation) → coming-soon pages, and the README describes Ovayi Farm with a demo script matching the navigation spec.
Verify: `npm run test:e2e` passes all specs and `npm run verify` passes (both outside the sandbox, ask approval).
Constraints: AGENTS.md hard rules. Mock mode only, no new deps, no browser downloads, don't modify content/, don't read .env.local. Fix bugs the tests reveal without redesigning.
Boundaries: tests/e2e/**, src/lib/metrics.ts, minimal fixes in src/**, README.md.
Iteration: run the failing spec first, fix, then rerun the full suites.
Blocked: if Playwright cannot launch, record the exact error in harness/build-log.md and stop.
Done: append evidence to harness/build-log.md, update PLANS.md + log table, summarize, and stop.
```

---

# v2: Responsive web product, accounts, dashboard, interactive labs (phases 9–14)

Claude finished step V (libraries, photos, new topics, labs/badges/media registries). Run these in order, each in a fresh Codex session (`/new`), approving between phases. Expect approval prompts for `npm run verify` and `npm run test:e2e` (they must run outside the sandbox).

## Phase 9: Design system + responsive, animated shell

```
/goal Complete Phase 09 exactly as specified in harness/build/phase-09-design-system.md.
Outcome: a modern edtech design system (tokens, light/dark with a persisted toggle and no flash), a sticky top nav (Learn, Labs, Dashboard, Sign in/up placeholders) and footer without the storage note, and every existing page (home, area, hub, coming-soon, lesson, activity, next, not-found) redesigned to look great at 1440/1280/768/375 with motion animations that respect reduced motion. Lesson pages get a 3-column desktop layout (TOC | lesson | guide) and a bottom-sheet guide on phones. The draft banner is removed; ::figure/::lab lines are hidden; the hub shows exactly one "Up next"; the duplicate hero parent line is gone; the dynamic-route prerender warning is fixed; the 2 newly live topics render.
Verify: `npm run check`, then `npm run verify` and `npm run test:e2e` outside the sandbox (ask approval), pass on BOTH Playwright projects (desktop-chromium 1440 and mobile-chromium 375), including the new assertions in the phase file; screenshots saved under test-results/phase-09/.
Constraints: AGENTS.md hard rules + responsive rules. content/ and public/media/ are read-only. No new deps, no remote assets, don't read .env.local. Keep existing behaviour; update tests deliberately (prefer roles/labels).
Boundaries: src/app/**, src/components/**, globals.css, playwright.config.ts, tests/**.
Iteration: run `npm run check` after each change and fix the first failing check; when green, run verify/e2e outside the sandbox.
Blocked: stop and log in harness/build-log.md.
Done: append evidence to harness/build-log.md, update PLANS.md + log table, summarize, and stop. Do not start Phase 10.
```

## Phase 10: Accounts + database + progress sync

```
/goal Complete Phase 10 exactly as specified in harness/build/phase-10-auth-db.md.
Outcome: optional email/password accounts with next-auth v4 (Credentials, JWT) and a Drizzle + libsql SQLite database (users, progress, events, dashboard_prefs, guide_history with cascades and migrations); /signup, /signin (with "Forgot password? Contact the admin" using catalog supportContact), protected /account (profile, theme, change password, delete account) and a protected /dashboard placeholder; a signed-in nav menu; progress and events synced to the account through the unchanged progress store API, with guest progress merged on sign-up/sign-in; progress schema gains `labs`.
Verify: `npm run check`, then `npm run verify` and `npm run test:e2e` outside the sandbox (ask approval) pass, with the unit and e2e cases listed in the phase file, using a temp SQLite DB; no secrets or passwords in test output.
Constraints: AGENTS.md hard rules incl. the security rules. Never read or write .env.local or print secrets; if NEXTAUTH_SECRET is missing, fail with a clear message. content/ is read-only. No new deps.
Boundaries: src/lib/db/**, src/lib/auth/**, src/app/api/auth/**, src/app/api/me/**, the signup/signin/account/dashboard routes under src/app/, src/lib/progress.ts, src/lib/metrics.ts, src/components/**, drizzle.config.ts, drizzle/**, tests/**, README.md (accounts setup section), .env.example.
Iteration: run `npm run check` after each change and fix the first failing check; when green, run verify/e2e outside the sandbox.
Blocked: stop and log in harness/build-log.md.
Done: append evidence to harness/build-log.md, update PLANS.md + log table, summarize (include the exact commands the human must run to set NEXTAUTH_SECRET and migrate), and stop. Do not start Phase 11.
```

## Phase 11: Customizable dashboard, streaks, badges

```
/goal Complete Phase 11 exactly as specified in harness/build/phase-11-dashboard.md.
Outcome: /dashboard with customizable widgets (continue, progress rings, streak, badges, activity chart, answers, guide history, labs, checks, time estimate, profile) that can be shown/hidden and reordered (pointer + keyboard) and persist per user; pure unit-tested calculators for streaks (Africa/Lagos), badges (rule-driven from content/badges.json), topic stats, activity series and time estimate; a badge-earned toast across the app.
Verify: `npm run check`, then `npm run verify` and `npm run test:e2e` outside the sandbox (ask approval) pass, with the calculator tests and the e2e cases in the phase file; the chart bundle is not loaded outside the dashboard; screenshots under test-results/phase-11/.
Constraints: AGENTS.md hard rules. No badge/topic/lab ids hardcoded in src (non-test). content/ is read-only. No new deps.
Boundaries: src/lib/insights/**, src/components/dashboard/**, src/app/dashboard/**, src/app/api/me/dashboard/**, small hooks in src/components/** for the toast, tests/**.
Iteration: run `npm run check` after each change and fix the first failing check; when green, run verify/e2e outside the sandbox.
Blocked: stop and log in harness/build-log.md.
Done: append evidence to harness/build-log.md, update PLANS.md + log table, summarize, and stop. Do not start Phase 12.
```

## Phase 12: Lesson media, lightbox, lab framework + 3D catfish

```
/goal Complete Phase 12 exactly as specified in harness/build/phase-12-media-3d.md.
Outcome: ::figure and ::lab directives render as credited next/image figures with a zoom/pan/rotate lightbox and lazily loaded labs inside a LabFrame; media/labs loaders + integrity checks; the catfish-3d lab as a procedural Clarias gariepinus model in react-three-fiber (orbit/zoom, presets, auto-rotate, hotspots anchored to body parts with chunk citations, adult/fingerling modes, completion saved to progress.labs, WebGL fallback); topic 2 fully live; the /labs teaser gallery; and /credits listing all media and sources.
Verify: `npm run check`, then `npm run verify` and `npm run test:e2e` outside the sandbox (ask approval) pass, with the unit and e2e cases in the phase file, including proof that three/r3f is not loaded on home or topic 1; screenshots under test-results/phase-12/.
Constraints: AGENTS.md hard rules. No remote assets or models; content/ and public/media/ are read-only; no new deps; keep the model under ~20k triangles; respect reduced motion.
Boundaries: src/lib/content/** (directives, media, labs), src/components/media/**, src/components/labs/**, src/app/labs/**, src/app/credits/**, lesson renderer, metrics schema, tests/**.
Iteration: run `npm run check` after each change and fix the first failing check; when green, run verify/e2e outside the sandbox.
Blocked: stop and log in harness/build-log.md.
Done: append evidence to harness/build-log.md, update PLANS.md + log table, summarize, and stop. Do not start Phase 13.
```

## Phase 13: Simulators

```
/goal Complete Phase 13 exactly as specified in harness/build/phase-13-simulators.md.
Outcome: three content-driven labs registered in the lab framework: water-source-sim (source picker, animated year slider, supply vs need, shortfall warnings, questions), pond-builder (draggable SVG pond with measuring tape and depth stick, live area/volume/litres, FAO reference markers, setup-type switcher, challenges), and spot-the-signs (animated SVG pond scenes, tap the warning signs, scored feedback, remedy). Each has a pure unit-tested logic module, is keyboard and touch accessible, shows its example note, cites chunks, and saves results to progress.labs; topic 4 is fully live; the dashboard and /labs reflect all 4 labs.
Verify: `npm run check`, then `npm run verify` and `npm run test:e2e` outside the sandbox (ask approval) pass, with the unit and e2e cases in the phase file; screenshots under test-results/phase-13/.
Constraints: AGENTS.md hard rules. Only illustrative numbers from labs.json; no invented facts, costs or specs; content/ is read-only; no new deps; reduced motion respected.
Boundaries: src/lib/labs/**, src/components/labs/**, small updates to the dashboard labs widget and /labs, tests/**.
Iteration: run `npm run check` after each change and fix the first failing check; when green, run verify/e2e outside the sandbox.
Blocked: stop and log in harness/build-log.md.
Done: append evidence to harness/build-log.md, update PLANS.md + log table, summarize, and stop. Do not start Phase 14.
```

## Phase 14: Full-journey E2E, performance, a11y, docs

```
/goal Complete Phase 14 exactly as specified in harness/build/phase-14-polish-e2e.md.
Outcome: a journey.spec.ts covering visitor → topic 1 → sign-up → all labs in topics 2–4 → dashboard → sign out/in → theme on both projects; keyboard-only lab specs; a contrast unit test for both themes; lazy-loading and First Load JS evidence; friendly error/empty states; dead code removed; and a rewritten README with screenshots, setup, accounts, labs, credits/licenses, testing and step-by-step Vercel + Turso deploy instructions.
Verify: `npm run check`, then `npm run verify` and `npm run test:e2e` outside the sandbox (ask approval) pass on both projects; `git ls-files` shows no .env.local, data/ or db files.
Constraints: AGENTS.md hard rules. No new features or deps; content/ is read-only; don't deploy or push.
Boundaries: tests/**, minimal fixes in src/**, README.md, docs/screenshots/**, .gitignore.
Iteration: run the failing spec first, fix, then rerun the full suites.
Blocked: stop and log in harness/build-log.md.
Done: append evidence to harness/build-log.md, update PLANS.md + log table, summarize, and stop.
```
