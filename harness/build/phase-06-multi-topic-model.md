# Phase 06: Multi-topic content model + APIs

**Status:** Not started

## Source inputs
`AGENTS.md`, `GOALS.md` (structure), `content/README.md` (**new layout**), all of `content/`, and the existing code in `src/lib/content/`, `src/lib/guide/`, `src/lib/feedback/` and `src/app/api/`.

## Why
The content was restructured from one lesson into a catalog → subject path → topics layout. The current code assumes a single lesson:
- zero-argument loaders (`src/lib/content/index.ts`)
- `pathwaySchema`
- closed `pathId`/`step` enums
- hardcoded `dry-season-check` / `talk-farmer` / `fictional` / `open-questions` / "Amina" / the `wa-` regex / the dry-season alias

`npm run check` fails at the start of this phase. That is expected.

## Objective
Content loading, the guide, feedback and help all work for **any live topic** described in `content/`, with no topic ids or copy hardcoded in `src/`.

## In scope
1. **Schemas** (`src/lib/content/schemas.ts`):
   - `catalogSchema`: product, intentions, areas → subjects; status is `live | coming-soon`; optional `path`.
   - `subjectPathSchema`: subject, title, intro, whatYouWillLearn, topics with order/status.
   - `topicConfigSchema`: welcome by intention, starterQuestions, synonyms, understandingCheck, stuckHints, nextSteps, defaultNextStep, unsupportedFallback, reminder.
   - Keep `lessonSchema` and `activitySchema`. In `activitySchema`, `paths[].id` becomes a string; `modelPoints` are optional on any path.
   - Remove `pathwaySchema`.
2. **Loaders** (`src/lib/content/index.ts`, server-only, per-key caches):
   - `getCatalog()`, `getSources()`
   - `getArea(areaSlug)`, `getSubject(areaSlug, subjectSlug)`
   - `getSubjectPath(subjectId)`
   - `getTopic(subjectId, topicSlug)` → `{ meta, lesson, config, activity }` for live topics; throws/returns null for coming-soon or unknown topics
   - `getChunk(subjectId, topicId, chunkId)`
   - `listLiveTopics()` for `generateStaticParams` later

   Read files from `content/<subject.path>/path.json` and `content/<subject.path>/<topic-id>/{lesson.md,topic.json,activity.json}`.
3. **Integrity** (`src/lib/content/integrity.ts`), checked across all live topics:
   - files exist for every live topic
   - every chunk cites a known source
   - chunk ids are unique **across** topics
   - every chunk id referenced in topic.json/activity.json (including chunk-like tokens inside stuck-hint prose) exists **in that topic**
   - fallback/default next steps exist
   - every activity path has an `activity-<pathId>` stuck hint
   - catalog subjects with `status: live` have a `path`

   Derive the chunk-token pattern from the topic's actual chunk ids, not a hardcoded `wa-` regex.
4. **Guide** (`src/lib/guide/**`):
   - The request gains a required `topicId` (plus the subject, resolved from the catalog; a `{ subjectId, topicId }` pair is fine). Validate it against live topics; an unknown or coming-soon topic → 400.
   - The prompt, mock retrieval, post-validation, unsupported fallback and next steps all use that topic's lesson/config only.
   - The mock applies `config.synonyms` instead of the hardcoded dry-season alias.
   - Citations from another topic are invalid.
5. **Feedback + help** (`src/lib/feedback/**`, `src/app/api/feedback`, `src/app/api/help`):
   - Add `topicId`; `pathId` and `step` are strings validated against that topic's activity paths and stuckHints keys.
   - Model-point comparison applies to any path that has `modelPoints`.
   - The default next step comes from `config.defaultNextStep[intention] ?? config.defaultNextStep.default`.
   - Remove the hardcoded rubric ids, names ("Amina") and next-step ids. Messages should be generic templates filled from content (criterion description, model point text).
6. **Update the existing unit tests** for the new loaders and contracts (keep their intent). Update the minimal UI call sites **only as far as needed to compile**: pass the water topic's ids from the existing pages, so the current UI keeps working until Phase 07. Do not redesign the UI.

## Non-goals
New pages/routes, navigation, progress changes, styling, e2e changes (the e2e suite may stay red until Phase 08; note it in the log).

## Acceptance criteria (unit tests, mock mode)
- `getCatalog()` has 3 areas. Animal farming has fish-farming live and 4 coming-soon subjects; crop and agro-processing are coming soon with their subjects.
- `getSubjectPath("fish-farming")` has 5 topics in order, 2 live (`what-is-fish-farming`, `water`).
- `getTopic` loads both live topics (8 `wf-` chunks, 10 `wa-` chunks). A coming-soon topic is not loadable as a lesson.
- `checkContentIntegrity()` returns `[]`. Fixture tests catch: an unknown source, a cross-topic chunk reference, a missing stuck hint for a path, and a duplicate chunk id across topics.
- Guide, what-is-fish-farming topic: "What do I need to start fish farming?" → supported, citations include `wf-05`, all citations start with `wf-`.
- Guide, water topic: "Why does the dry season matter for a fish pond?" → supported, cites `wa-03` (via synonyms), all citations start with `wa-`.
- Guide: a medicine-dosage question in either topic → `supported:false`, that topic's fallback next step, no citations.
- Guide: unknown topicId and coming-soon topicId → 400.
- Feedback, what-is-fish-farming: the `reflect` example → completed with a valid strength. A fictional answer about Tunde mentioning savings and weekdays → completed, and toConsider suggests an uncovered model point. "idk" → `completed:false` with the `activity-reflect` / `activity-fictional` hint.
- Feedback, water: the existing three-path behaviour still passes.
- `/api/help` works for both topics' steps; an unknown step → 400.
- `grep -rn "Amina\|Tunde\|dry-season-check\|wa-\|wf-" src --include=*.ts --include=*.tsx` finds matches **only in test files**.
- `npm run verify` passes.

## Required evidence
Test counts, the grep result, and the verify summary in `harness/build-log.md`. State the e2e status (expected red until Phase 08).

## Stop condition
Stop after the acceptance criteria are verified. Do not begin Phase 07.
