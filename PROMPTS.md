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
