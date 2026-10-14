# Ovayi Farm

**Ovayi Farm, by Ovayi Foods**, is a phone-first learning companion for curious beginners in Nigeria. Explore an area → subject path → topic lesson → source-grounded guide → inclusive activity → feedback → next steps. No sign-up, farm access or commitment to invest is needed.

The catalog has **Animal farming**, **Crop farming** and **Agro-processing**. Fish farming is the live subject, with five authored topics. Two are available: **What is fish farming, and is it for me?** and **Water: do I have enough?** The other topics, subjects and areas are labelled coming soon.

> **Draft content:** material in `content/` is sourced from public references and has not been reviewed by a fisheries expert. Lessons show the review note and sources. The guide answers only from the current topic's lesson chunks, with citations; unsupported questions receive an honest limitation and an authored next step.

## Setup

Use Node.js 24 and npm. For a fresh checkout:

```powershell
npm install
Copy-Item .env.example .env.local
$env:GUIDE_MODE = 'mock'
npm run dev
```

Open [localhost:3000](http://localhost:3000). Keep an existing settings file when returning. Dependencies are already installed in the prepared hackathon workspace; automated phase work does not install packages or download browsers.

## Mock and live modes

- `GUIDE_MODE=mock` is the default. The guide retrieves deterministic lesson excerpts using authored topic synonyms; feedback uses that topic's rubric and model points. No API key or OpenAI call is needed.
- Live mode requires `GUIDE_MODE=live`, `OPENAI_API_KEY` and `OPENAI_MODEL` set to a Responses API model supporting structured outputs. Configure these yourself in `.env.local`, never commit or share that file, and restart the server after changing settings.
- A live-provider error uses the mock with `mode: "mock-fallback"`. Citations, rubric ids and next steps are checked against the requested topic; citations from another topic are invalid.
- Unit and E2E tests explicitly use mock mode even if personal settings select live mode. Browser tests block external requests and assert mock API responses.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run check` | Lint, typecheck and mock unit tests |
| `npm run verify` | Check plus production build |
| `npm run test` | Unit tests in mock mode |
| `npm run test:e2e` | Build and serve on port 3100; seven mobile Playwright specs in mock mode |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |

On Windows, E2E uses the already-installed Microsoft Edge channel. Other platforms use preinstalled Playwright Chromium. The shared fixture enforces the 375px viewport, reports browser errors and blocks external requests. No browser download runs during tests.

The Windows Codex sandbox has a documented Next.js build limitation. Run `npm run check` inside it and request approval for `npm run verify` and `npm run test:e2e` outside it. See [AGENTS.md](AGENTS.md) and [build evidence](harness/build-log.md).

## Six-step demo

This follows `tests/e2e/navigation.spec.ts`. Use mock mode for a repeatable demo; start with fresh app progress on the device.

1. Open `/`. Show **Ovayi Farm**, **by Ovayi Foods**, the tagline and pitch, and the three area cards. Choose **I'm thinking about starting**. Open **Animal farming**, then **Fish farming**. Show the subject intro, five-topic path and three coming-soon topics; those topics are not links in the hub.
2. Select **Start** to open **What is fish farming, and is it for me?** Show the draft warning and sources, answer the understanding check, then ask **What do I need to start fish farming?** Show the `wf-05` citation, which links to its lesson chunk.
3. Select **Try the activity**. Choose **Think about someone else's situation**, read Tunde's fictional situation and submit: **Tunde works weekdays far from the site and has some savings. He should learn from an experienced farmer before investing.** Show completed feedback and chunk links, then **See my next steps**. Show **Next topic: Water: do I have enough?**
4. Select **Back to Fish farming path**. The first topic is **Done**, and the primary action reads **Continue: Water: do I have enough?**
5. Continue to the water lesson. Ask **Why does the dry season matter for a fish pond?** and show the `wa-03` citation. Use **Try the activity → Pause and see next steps** to show that water's session has its own check score and completion status. It does not inherit topic 1's completed activity.
6. Return home and open **Crop farming** to show its coming-soon subjects and a way back. Open **Animal farming → Poultry** to show the friendly coming-soon page, the link back to the area and the available fish path.

For additional demonstrations, the water topic offers observation, question-writing and Amina's fictional scenario. Submit **idk**, then tap **Stuck?** to reveal authored help; retry using an example or a scenario response. Ask **What dose of medicine should I give sick catfish?** to show the limitation and next step with no citations. Next-step pages offer a reminder preview explicitly labelled **Demo: reminders are not sent in this prototype** and a would-return poll. Reload or use the home **Continue where you left off** card to resume the last topic page. **Start over** on a next-step page clears this app's progress and event log.

## Routes

| Route | Page |
|---|---|
| `/` | Catalog home, intention choice and last-page resume |
| `/[area]` | Area description and subject cards |
| `/[area]/[subject]` | Subject hub or coming-soon page |
| `/[area]/[subject]/[topic]` | Topic lesson, check, guide and authored help; coming-soon topics have a friendly view |
| `/[area]/[subject]/[topic]/activity` | Inclusive topic activity and feedback |
| `/[area]/[subject]/[topic]/next` | Topic session summary, next steps, optional reminder demo and return poll |
| `/api/guide`, `/api/feedback`, `/api/help` | Topic-validated JSON POST APIs |

Areas, subjects and live topic pages are generated from the catalog/path. Every non-home page has breadcrumbs. Unknown slugs show a page linking home. The old top-level `/lesson`, `/activity` and `/next` pages were removed.

## Device progress and metrics

`agri-progress-v2` stores a global intention, topic records keyed by `<subjectId>/<topicId>`, per-topic reminder choices, return preference and `lastPath`. Each topic record has viewed status, check answers, guide count, activity draft/feedback and completion. Home resumes the exact last topic page; the hub shows each topic's status. V1 progress is ignored. When localStorage is blocked, the app falls back to memory for the current page session.

`agri-events-v1` stores timestamped local events. `area_opened` identifies the area; `subject_opened` identifies area and subject; `topic_opened` identifies area, subject and topic. Topic learning events (`lesson_viewed`, `check_answered`, `guide_asked`, `guide_unsupported`, `help_requested`, `activity_submitted`, `activity_completed`, `would_return`) carry `subjectId` and `topicId`. The intention choice is global. Navigation opens record page visits; `lesson_viewed` is recorded once per saved topic. Retries and changed choices append events. Older topic events without identifiers are ignored while valid records are kept.

Events contain small choice/status fields, not learner question or response text, and are never sent to an analytics service. **Your session** shows the current topic's completed activity and check score, plus the global would-return preference. These local self-reports do not establish retention.

## Content and project layout

- `content/catalog.json`: product, intentions, areas and subjects.
- `content/sources.json`: shared sources.
- `content/<subject.path>/path.json`: subject intro and ordered topic metadata.
- `content/<subject.path>/<topic-id>/{lesson.md,topic.json,activity.json}`: lesson chunks, topic configuration and activity/rubric for each live topic.
- `src/app/`: content-driven pages and API handlers.
- `src/components/`: small interactive learning and navigation components.
- `src/lib/content/`: validated loaders, lesson parser and integrity checks.
- `src/lib/guide/`, `src/lib/feedback/`: mock/live providers and post-validation.
- `src/lib/progress.ts`, `src/lib/metrics.ts`: device progress and local events.
- `tests/e2e/`: navigation, full water loop, no farm access, stuck help, unsupported question, resume/reset and mobile layout.
- `tests/manual/`: development smoke scripts, including the Phase 07 journey.
- `harness/`: phase specifications and observed evidence.

Humans maintain `content/`; automated agents treat it as read-only. Follow [content/README.md](content/README.md) for metadata, chunk headings, source ids, references and topic layout. Keep ids stable, cite known sources and keep config/activity references local to the topic. Do not add technical prescriptions without cited support. Run integrity/unit tests and both verification suites after a human content edit. Agricultural material still needs expert review.

Product scope: [agritech-learning-brainstorm.md](agritech-learning-brainstorm.md). Phase status: [PLANS.md](PLANS.md).

## Known limitations

Only two fish topics are live; the other three topics and all other subjects are coming soon. Content is draft, English-only and not expert-reviewed. Mock test success does not establish live model accuracy; the human still needs to run the live smoke test. There are no live reminders, accounts, shared progress, offline caching, full-cycle curriculum or live diagnosis. Device storage can be blocked or cleared. Willingness to return is a local self-report: **long-term retention is unproven**.

Additional topics, translations and other features need content review and learner validation. Deployment and GitHub push remain human actions requiring approval.
