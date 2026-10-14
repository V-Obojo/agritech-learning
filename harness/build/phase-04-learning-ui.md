# Phase 04: Mobile learning-loop UI + saved progress

**Status:** Not started

## Source inputs
`AGENTS.md`, `GOALS.md` (core loop), `agritech-learning-brainstorm.md` Part 2, Phase 01–03 APIs and content.

## Objective
A phone-first web flow that walks the learner through the complete loop, with progress saved on the device.

## In scope
- **Progress store** `src/lib/progress.ts` (client): localStorage key `agri-progress-v1`, zod-validated, every read/write wrapped in try/catch (falls back to in-memory). Shape:
  `{ intention, lessonViewed, checkAnswers: Record<string, number>, guideQuestionsAsked, activity: { pathId, response, feedback } | null, reminderOptIn, wouldReturn: "yes"|"maybe"|"no"|null, updatedAt }`. Also `resetProgress()`.
- **Pages** (App Router; server components load content, client components handle interaction):
  1. `/`: short welcome (what this is, takes ~10 minutes, no sign-up), intention choice from `pathway.intentions`, a stage strip showing authored stages (inactive ones shown as "coming later"), and a "Continue where you left off" button when progress exists.
  2. `/lesson`: draft banner (`review_note`), the intention's welcome line, chunks as short sections, each with a "Sources" disclosure listing source titles + links. Then the 3-question understanding check with instant feedback pointing to the chunk. A "Stuck?" button calls `/api/help` (step `lesson`).
  3. Guide panel (on `/lesson`, below the check): a question input, the answer with citation chips (chunk id + title, tap to scroll to the chunk), a clear "not covered" style when `supported:false` showing the next step, and a "Stuck?" hint. Show 2–3 suggested starter questions.
  4. `/activity`: choose one of 3 paths (the fictional path shows Amina's scenario), example text revealed on tap, a textarea, submit → feedback card (strength, things to consider with chunk links, next step). "Stuck?" calls `/api/help` with the path's step. If `completed:false`, show the hint and let them try again.
  5. `/next`: summary (intention, check score, activity done), the recommended next step + other next steps, the **optional reminder demo** (opt-in toggle that shows `reminder.preview` with the label "Demo: reminders are not sent in this prototype"), and "Would you come back to learn the next topic?" (yes/maybe/no) saved to progress. "Pausing here is a fine choice" message. Start-over link.
- Global: draft banner component; header with app name; large tap targets; system fonts; no images; works at 375px; accessible labels, focus states, and `aria-live` for answers and feedback.

## Non-goals
Accounts, server-side storage, real reminders, offline caching, extra topics.

## Acceptance criteria
- Unit tests for `progress.ts`: save/load round-trip, corrupted JSON → defaults, localStorage throwing → still works in memory.
- Manual flow works in `npm run dev` in mock mode: `/` → `/lesson` → guide question → `/activity` → feedback → `/next`; a reload on any page keeps progress.
- No page imports server-only modules into client components (build passes).
- `npm run verify` passes.

## Required evidence
The verify summary, and a short list of pages/components created, in `harness/build-log.md`.

## Stop condition
Stop after the acceptance criteria are verified. Do not begin Phase 05.
