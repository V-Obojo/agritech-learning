# Phase 07: Ovayi Farm navigation + per-topic UI

**Status:** Not started

## Source inputs
`AGENTS.md`, `GOALS.md` (structure + loop), `content/catalog.json`, `content/fish-farming/path.json`, the Phase 06 loaders/APIs, and the existing components in `src/components/`.

## Objective
The full product journey works on a phone: **Home (Ovayi Farm) → Area → Subject hub → Topic lesson → Activity → Next steps**, for every live topic. Every name, label, link and topic comes from `content/`.

## Routes (App Router, statically generated with `generateStaticParams` from the catalog/path)
| Route | Page |
|---|---|
| `/` | **Home.** Wordmark "Ovayi Farm" + "by Ovayi Foods", `product.tagline`, `product.pitch` (no "first step for curious beginners" line). "What brings you here?" intention radios (saved to progress; preselected if already chosen). Area cards (label, blurb, a status badge; coming-soon areas list their subjects as small muted chips). A "Continue where you left off" card when `lastPath` exists. |
| `/[area]` | **Area page.** Breadcrumb, area label + blurb, subject cards: live → link to the hub; coming soon → muted card with a "Coming soon" badge linking to the subject's coming-soon page. |
| `/[area]/[subject]` | **Live subject → hub:** breadcrumb, title, `intro`, "What you'll learn" list, intention line "You're here because: <label> · Change" (inline radios to change), the ordered topic path (number, title, summary, status badge: Done / In progress / Up next / Coming soon), and a primary button "Start" or "Continue: <topic>" (first live topic not done). Coming-soon topics are not links. **Coming-soon subject →** friendly "Coming soon" page with a link back to the area and to the fish farming hub. |
| `/[area]/[subject]/[topic]` | **Lesson** (the existing lesson flow, now topic-aware): eyebrow "Topic N of 5", the draft banner, the intention welcome from `config.welcome`, chunks + sources, understanding check, guide panel (starter questions from `config.starterQuestions`), Stuck? help. Then "Try the activity". A coming-soon topic → a coming-soon page linking back to the hub. |
| `/[area]/[subject]/[topic]/activity` | The existing activity flow, topic-aware (paths, scenario heading and default path from content). |
| `/[area]/[subject]/[topic]/next` | The existing next flow, topic-aware. The recommended step uses `defaultNextStep`. "Back to fish farming path" button and, if there is one, "Next topic: <title>" (the next live topic). Reminder demo from `config.reminder`. Would-return poll. |

- Unknown slugs → `notFound()`. A simple `not-found.tsx` links home.
- Remove the old top-level `/lesson`, `/activity`, `/next` pages (redirects are not needed).
- **Breadcrumb** component on all non-home pages (e.g. Home › Animal farming › Fish farming › Water: do I have enough?).
- **Header:** "Ovayi Farm" wordmark linking home, plus a small "by Ovayi Foods". Footer keeps the device-storage note.

## Components
Make `LessonFlow`, `GuidePanel`, `ActivityFlow`, `NextFlow`, `StuckHelp` and `WelcomeFlow` (now the home) take the topic data + ids + `basePath` as props.
- No hardcoded routes, topic ids, names or copy.
- API calls send `topicId` (and subject).
- Citation chips link to `#<chunkId>` on the lesson page, or to `<basePath>#<chunkId>` from the activity page.

## Progress v2 (`src/lib/progress.ts`)
- Key `agri-progress-v2`:
  `{ intention, topics: Record<topicKey, { viewed, checkAnswers, guideQuestionsAsked, activity: {pathId, response, feedback} | null, completed }>, reminderOptIn: Record<topicKey, boolean>, wouldReturn, lastPath, updatedAt }`
  where `topicKey = "<subjectId>/<topicId>"`.
- zod-validated; every access wrapped in try/catch with an in-memory fallback.
- `topicStatus(progress, key)` → `done | in-progress | not-started`.
- `lastPath` is updated on every topic page visit.
- `resetProgress()` keeps working. Ignore old v1 data.

## Look (`src/app/globals.css`)
Keep the clean green, add earthy accents as CSS variables (light + dark):
- primary green
- soil brown (`--soil`) for secondary text, badges and borders
- warm amber accent (`--amber`, the existing focus colour) for "Up next" / call-outs
- a soft cream page background in light mode

Status badges: Done (green), In progress / Up next (amber), Coming soon (muted soil). Text only, no images or icon fonts. Cards have large tap targets and nothing scrolls sideways at 375px.

## Non-goals
New content, new APIs, e2e updates (Phase 08), real reminders, accounts.

## Acceptance criteria
- Unit tests for progress v2: per-topic round-trip, `topicStatus`, `lastPath`, corrupted JSON → defaults, localStorage throwing → in-memory.
- Unit test (or build-time assertion) that `generateStaticParams` yields exactly the live topics and the catalog's area/subject slugs.
- Manual smoke in `npm run dev` (mock mode):
  1. home → choose intention → Animal farming → Fish farming hub
  2. hub shows 5 topics (3 coming soon) and "Start"
  3. topic 1 lesson → guide → activity (reflect) → feedback → next
  4. back to the hub: topic 1 shows Done, and the button shows "Continue: Water: do I have enough?"
  5. water topic loop
  6. Crop farming and Poultry show coming-soon pages
  7. reload resumes; "Continue where you left off" on home

  Record this in the build log. Use the existing manual smoke-script approach if helpful, and update `tests/manual/` accordingly.
- `grep` for hardcoded topic/subject names in `src/` (non-test) finds none.
- `npm run verify` passes.

## Required evidence
The verify summary, the smoke results and a list of routes/components in `harness/build-log.md`. Note that e2e is still to be updated in Phase 08.

## Stop condition
Stop after the acceptance criteria are verified. Do not begin Phase 08.
