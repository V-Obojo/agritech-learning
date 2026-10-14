# Phase 01: Content loader + offline-safe layout

**Status:** Not started

## Source inputs
`AGENTS.md`, `GOALS.md`, `content/README.md`, all files in `content/`.

## Objective
Load all `content/` files into typed, zod-validated objects that later phases use, and make the production build independent of the network.

## In scope
1. **Placeholder page.** (The layout fonts/title were already fixed during setup.) Replace the default `src/app/page.tsx` with a minimal placeholder ("Fish Farming Basics — coming soon") and delete the unused default SVGs in `public/`.
2. `src/lib/content/schemas.ts`: zod schemas + inferred types for `Source`, `LessonChunk` (`id`, `title`, `sourceIds`, `body`), `Lesson` (frontmatter fields + `chunks`), `Activity` (paths, rubric, feedbackRules), `Pathway` (intentions, stages, understandingCheck, stuckHints, nextSteps, unsupportedFallback, reminder).
3. `src/lib/content/parse-lesson.ts`: a pure function `parseLesson(markdown: string): Lesson` following the format in `content/README.md`. It parses frontmatter between the first two `---` lines (simple `key: value`; no new deps), splits chunks on `## <id>: <title>`, reads the `sources:` line, and trims the body.
4. `src/lib/content/index.ts` (server-only): `getSources()`, `getLesson()`, `getActivity()`, `getPathway()`, `getChunk(id)`, `getChunks(ids)`. Read with `fs` from `path.join(process.cwd(), "content", ...)`, validate with zod, and cache in module scope. Throw a clear error if validation fails.
5. `src/lib/content/integrity.ts`: `checkContentIntegrity()` returns a list of problems:
   - chunks with no sources, or source ids missing from `sources.json`
   - duplicate chunk ids
   - chunk ids referenced in `activity.json` / `pathway.json` that don't exist
   - `unsupportedFallback.nextStep` not found in `nextSteps`

## Non-goals
Any API route, UI beyond the placeholder page, or OpenAI code.

## Acceptance criteria
- `getLesson()` returns 10 chunks, `wa-01`…`wa-10`, each with ≥1 source id and a non-empty body.
- `checkContentIntegrity()` returns `[]` for the current content.
- A unit test proves `parseLesson` handles multi-paragraph bodies and bullet lists, and rejects a chunk without a `sources:` line.
- A unit test proves integrity checks catch an unknown source id and an unknown chunk reference (use in-memory fixtures; do **not** modify `content/`).
- `npm run verify` passes (run the build part with escalation; see AGENTS.md).

## Required evidence
The `npm run verify` output summary (test count, build success) in `harness/build-log.md`.

## Stop condition
Stop when the acceptance criteria are verified. Do not begin Phase 02.
