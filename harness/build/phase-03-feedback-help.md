# Phase 03: Activity feedback + stuck help APIs

**Status:** Not started

## Source inputs
`AGENTS.md`, `content/activity.json` (paths, rubric, modelPoints, feedbackRules), `content/pathway.json` (stuckHints, nextSteps), Phase 01–02 code.

## Objective
Give useful, rubric-based feedback on all three activity paths, and give help to a learner who is stuck. Both work in mock mode with no key.

## Contracts
`POST /api/feedback`
```ts
// request
{ pathId: "observe"|"questions"|"fictional", response: string /* 1..2000 chars */, intention?: string }
// 200
{ completed: boolean,
  strengths:  { criterionId: string; message: string; chunkIds: string[] }[],  // 1 item when completed
  toConsider: { criterionId: string; message: string; chunkIds: string[] }[],  // 1–2 items
  nextStep: { id: string; label: string },
  hint?: string,               // present when completed=false
  mode: "mock"|"live"|"mock-fallback" }
```
If the response is under 20 meaningful characters → `completed:false`, with `hint` from `stuckHints["activity-<pathId>"]` and empty arrays.

`POST /api/help`
```ts
// request
{ step: "lesson"|"activity-observe"|"activity-questions"|"activity-fictional"|"guide", question?: string }
// 200
{ hint: string /* authored, from pathway.stuckHints */, explanation?: GuideResponse /* from answerQuestion when question given */ }
```

## In scope
- `src/lib/feedback/mock.ts`:
  - match rubric criteria by keywords (case-insensitive)
  - strengths = the first matched criterion; toConsider = up to 2 unmatched criteria, worded as gentle questions; each includes the criterion's chunk ids
  - fictional path: also count which `modelPoints` criteria were covered, and suggest the top uncovered model point
- `src/lib/feedback/openai.ts`: live provider with the rubric, feedbackRules, the relevant chunks, and (fictional) modelPoints in the prompt. Structured output via `zodTextFormat`.
- `src/lib/feedback/index.ts`: chooses the mode exactly like the guide does.
  - Post-validation: criterion ids must exist in the rubric and chunk ids must exist; drop invalid entries; if strengths ends up empty while completed, fall back to the mock result.
  - nextStep must be a real `nextSteps` id (pick by intention: `considering` → `dry-season-check`, otherwise `talk-farmer`, unless the model's choice is valid).
- `src/app/api/feedback/route.ts`, `src/app/api/help/route.ts`.

## Non-goals
Storing responses server-side, scoring/grades, UI.

## Acceptance criteria (mock-mode tests)
- **observe:** the example text from `activity.json` → `completed:true`, ≥1 strength, ≤2 toConsider, all chunk ids valid.
- **questions:** the example text → `completed:true`; `open-questions` is recognised as a strength or covered.
- **fictional (no-farm-access path):** a reasonable answer about Amina mentioning the dry-season well and testing → `completed:true`, and toConsider points to an uncovered model point (e.g. gravity/stream lower → `wa-04`).
- A too-short response ("idk") → `completed:false` with the authored hint.
- `/api/help` with `step:"activity-fictional"` returns the authored hint. With `question` it also returns a guide explanation that has citations or `supported:false`.
- Invalid bodies → 400.
- `npm run verify` passes. No network in tests.

## Required evidence
Test names, pass counts, and the verify summary in `harness/build-log.md`. Note that the backend checkpoint is ready for the human live smoke test.

## Stop condition
Stop after the acceptance criteria are verified. Do not begin Phase 04. The human will do a live smoke test and a GitHub push first.
