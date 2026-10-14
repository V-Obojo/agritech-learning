# Phase 13: Simulators: water source, pond builder, spot the signs

**Status:** Not started

## Source inputs
`AGENTS.md`, `content/labs.json` (labs `water-source-sim`, `pond-builder`, `spot-the-signs`), `content/media.json`, the water and setup-options topics, and the Phase 12 lab framework (`LabFrame`, registry, progress `labs`, lab events).

## Objective
Three more hands-on labs, embedded in the water topic (topic 3) and the setup-options topic (topic 4). Each is driven entirely by `labs.json`, cites lesson chunks, and saves results that feed the dashboard and badges. Topic 4 is fully live.

## In scope
For each lab:
- Put the logic in a **pure, unit-tested module** (`src/lib/labs/<type>.ts`).
- Build a client component registered in the lab registry.
- Make it keyboard accessible and work with touch.
- Animate it with `motion`/SVG, with reduced-motion fallbacks.
- Show `exampleNote` where present.

1. **`water-source-sim`** (type `water-simulator`):
   - Source picker cards, each with the photo thumbnail from `media`, where defined.
   - A year timeline slider over `months`, with play/pause animation. Wet and dry months are tinted.
   - An animated SVG scene: a source tank/column filling and draining to the month's level, and the pond level showing need vs supply (`pondNeed` by season).
   - A shortfall warning that names the shortfall in the scenario's units when supply < need.
   - A side chart line of supply vs need across the year, highlighting the current month (plain SVG, no Recharts needed).
   - Each source's `note` with chunk chips.
   - `questions` as multiple choice with explanations.
   - Completion per `completion` (explored N sources + answered the questions).
   - Logic module: `shortfallByMonth`, `worstMonth`, `sourcesCoveringAllYear`, plus the completion check.
2. **`pond-builder`** (type `pond-builder`):
   - A top-down SVG canvas with a grid (1 m). A rectangle pond with draggable corner/edge handles snaps to `step`. A measuring tape along two edges shows live metre labels.
   - Numeric inputs for length/width/depth stay in sync with dragging.
   - A depth "measuring stick" side view (a drag handle) with `minDepth`–`maxDepth`.
   - Live readouts: area m², volume m³, litres (formulas from `math`), with animated number transitions.
   - Reference markers from `references`: an area bar showing the current area vs 300 m² and 400 m²; depth markers 0.75 m and 1 m on the stick. Each has a chunk chip.
   - A setup-type switcher (earthen/concrete/tarpaulin) that changes the visual style and shows the type text + photo + chunk chips. No costs, no specs.
   - `challenges` with live check status (✓ when the current dimensions satisfy `check`) and explanations. Completion per `completion`.
   - Logic module: `area`, `volume`, `litres`, `snap`, `clamp`, `checkChallenge` (supports `length/width`, `square`, `minArea/maxArea`).
3. **`spot-the-signs`** (type `observation`):
   - Each scene is an animated SVG pond illustration composed from the `visual` keys:
     - `fish-surface`: fish heads breaking the surface with bubbles
     - `feed-floating`: pellets drifting
     - `bird`: a bird on the bank
     - `water-muddy`: a brown water tint
     - `fish-swimming`: fish swimming briskly
     - `leaves`: floating leaves
     - `fish-feeding`: fish converging on pellets
     - `fish-weak`: a slow, listing fish
     - `smell`: wavy smell lines rising

     These are illustrations made in code, not photos.
   - The learner taps elements. A correct sign highlights green with its `explain` + chunk chip; a non-sign shows its `explain` neutrally. A score and "found x of y signs" are tracked.
   - A scene stepper with the context text; the end screen shows the score per scene and the `remedy` text.
   - Completion per `completion` (all scenes done). The score is saved.
   - Logic module: `evaluateTap`, `sceneScore`, `overallScore`.
4. **Topic 4 live:** `setup-options` renders with its figures and `pond-builder`. Check the guide/feedback (mock) and hub status (5 topics, 4 live).
5. **Dashboard/labs integration:** the labs widget shows status/score for all 4 labs. Lab badges unlock (they're already rule-driven). The `/labs` gallery cards now show working previews and "Open in lesson" for all 4.

## Non-goals
New content, real hydrology, cost calculators.

## Acceptance criteria
- Unit tests for all three logic modules (including the edge values: min/max sizes, the 17.5 m square challenge, all-year coverage = borehole only for the example data, worst month = dry, scoring with wrong taps).
- E2E (both projects):
  1. **Water sim:** choose the shared well → slide to a dry month → the shortfall warning appears. Explore 3 sources, answer both questions correctly → Completed, and `progress.labs['water-source-sim'].completed`.
  2. **Pond builder:** type 20 × 20 → area 400 m² and the challenge ✓. Drag a handle (assert the width changes). Complete 2 challenges → Completed.
  3. **Spot the signs:** tap every sign in all 3 scenes (ids from `labs.json`) → Completed with the score shown. A wrong tap shows the neutral explanation.
  4. Signed in: after the labs, the dashboard labs widget shows all completed and the lab badges are earned.
- `npm run verify` and `npm run test:e2e` pass.

## Required evidence
Test summaries and screenshots of each lab (desktop + mobile) under `test-results/phase-13/`, in `harness/build-log.md`.

## Stop condition
Stop after the acceptance criteria are verified. Do not begin Phase 14.
