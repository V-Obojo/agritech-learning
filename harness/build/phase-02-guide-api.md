# Phase 02: Guide API (source-grounded)

**Status:** Not started

## Source inputs
`AGENTS.md`, `GOALS.md`, Phase 01 code in `src/lib/content/`, `content/pathway.json` (`unsupportedFallback`, `nextSteps`).

## Objective
`POST /api/guide` answers a learner's question **only** from lesson chunks, cites chunk ids, and is honest when the content does not cover the question.

## Contract
Request (zod-validated):
```ts
{ question: string /* 1..500 chars, trimmed */, intention?: "curious"|"considering"|"student",
  history?: { role: "user"|"assistant"; content: string }[] /* max 6 items */ }
```
Response 200:
```ts
{ answer: string,
  supported: boolean,
  citations: { chunkId: string; title: string; sources: { id: string; title: string; url: string }[] }[],
  nextStep: { id: string; label: string },
  mode: "mock" | "live" | "mock-fallback" }
```
Invalid request → 400 `{ error }`.

## In scope
- `src/lib/guide/types.ts`: request/response zod schemas, plus a `ModelGuideOutput` schema for the model: `{ answer, supported, citedChunkIds: string[], nextStepId: string }`. All fields are required, as structured outputs need.
- `src/lib/guide/prompt.ts`: builds instructions + input. Each chunk is included as `[wa-NN] Title\nbody`. Rules for the model:
  - answer only from the chunks; cite ids
  - if the chunks don't cover it, set `supported=false` and don't guess
  - never give doses, stocking numbers, or thresholds not in the chunks
  - keep it short and plain for a beginner
  - choose `nextStepId` from the provided list
- `src/lib/guide/mock.ts`: a deterministic provider.
  - Retrieval: keyword overlap between the question and chunk title+body (lowercased, stop-words removed).
  - Unsupported when the best score is below a threshold, or the question hits out-of-scope terms (e.g. dose, dosage, medicine, drug, treat, disease cure, price, loan, credit, feed formula, stocking density).
  - The answer is composed from the top 1–2 chunks' first sentences.
- `src/lib/guide/openai.ts`: live provider using `client.responses.parse({ model: process.env.OPENAI_MODEL, instructions, input, text: { format: zodTextFormat(ModelGuideOutput, "guide_answer") } })` from `openai` + `openai/helpers/zod`, reading `response.output_parsed`.
- `src/lib/guide/index.ts`: `answerQuestion(req)`.
  - Choose live only if `GUIDE_MODE==="live"` and `OPENAI_API_KEY` is set; on a live error, fall back to mock with `mode:"mock-fallback"` and log the error server-side (never the key).
  - **Post-validation (both modes):** drop cited ids that aren't real chunks. If `supported` but no valid citations remain, convert to unsupported. Unsupported answers use `pathway.unsupportedFallback.message` + its next step. Map `nextStepId` to a real next step (default: fallback next step).
- `src/app/api/guide/route.ts`: the POST handler. Make sure it runs dynamically (check `node_modules/next/dist/docs/` for route-handler + cache-components guidance).

## Non-goals
Streaming, chat persistence, UI, vector stores, feedback/help endpoints.

## Acceptance criteria (tests in mock mode)
- "Why does the dry season matter for a fish pond?" → `supported:true`, citations include `wa-03`, every citation is a real chunk with resolved sources.
- "What dose of medicine should I give sick catfish?" → `supported:false`, the fallback message, nextStep `talk-extension`, no citations.
- Post-validation unit test: a fake model output citing `wa-99` plus `supported:true` and no valid ids → converted to unsupported.
- Invalid body (empty question, 501 chars) → 400.
- The route handler is tested by calling the exported `POST` with a `Request` object (no server needed).
- `npm run verify` passes. No test touches the network.

## Required evidence
Test names + pass counts + the verify summary in `harness/build-log.md`.

## Stop condition
Stop after the acceptance criteria are verified. Do not begin Phase 03.
