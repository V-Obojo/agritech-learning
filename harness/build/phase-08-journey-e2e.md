# Phase 08: E2E + demo polish for the full Ovayi Farm journey

**Status:** Not started

## Source inputs
`AGENTS.md`, `GOALS.md` (success conditions), `playwright.config.ts`, `tests/e2e/**`, the Phase 06–07 code, `content/`.

## Objective
Prove the full journey works at 375px in mock mode, attach `topicId` to metrics, and make the README demo script match the new product.

## In scope
- **Metrics** (`src/lib/metrics.ts`): every topic event carries `{ subjectId, topicId }`. Add `area_opened`, `subject_opened` and `topic_opened` events. The `/next` "Your session" summary is per topic.
- **Fixtures** (`tests/e2e/fixtures.ts`): read content from the new layout. Add helpers: `chooseIntention`, `openFishHub` (home → Animal farming → Fish farming), `openTopic(slug)`. Derive URLs from `catalog.json`/`path.json`, not literals where practical.
- **Update the 6 existing specs** to the new routes and content (water topic for the observe/questions/Amina cases):
  - full loop
  - no farm access
  - stuck → help
  - unsupported
  - resume
  - no horizontal scroll (now also covering home, area, hub, coming-soon and both topics' pages)
- **New `navigation.spec.ts`:**
  1. Home shows "Ovayi Farm", "by Ovayi Foods", the 3 areas, and **does not** contain "A first step for curious beginners".
  2. Choose "I'm thinking about starting" → Animal farming → Fish farming. The hub shows the intro, 5 topics, and 3 "Coming soon" badges that are not links.
  3. Start → topic 1. Answer the check, ask "What do I need to start fish farming?" → a `wf-05` citation appears. Do the activity via the `fictional` (Tunde) path → feedback → next steps show "Next topic: Water: do I have enough?"
  4. Back to the hub: topic 1 shows Done, and "Continue: Water: do I have enough?" is visible.
  5. Water topic: ask the dry-season question → a `wa-03` citation.
  6. The Crop farming area page and the Poultry coming-soon page render with a link back.
- **README:** update the product name and description (Ovayi Farm by Ovayi Foods), the new 6-step demo script following the navigation spec, the routes table, the content layout (link `content/README.md`), and known limitations (2 live topics, the rest coming soon; draft content; retention unproven).

## Non-goals
New features or content, deployment, real reminders.

## Acceptance criteria
- `npm run test:e2e` passes all specs (6 updated + navigation).
- `npm run verify` passes.
- The README demo script matches the navigation spec.

## Required evidence
The Playwright summary and the verify summary in `harness/build-log.md`; the final `PLANS.md` statuses.

## Stop condition
Stop after the acceptance criteria are verified. The human does the live smoke test and the push.
