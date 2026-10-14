# Fish Farming Basics

A hackathon learning companion for curious beginners in Nigeria exploring **water availability for catfish farming**. The phone-first flow is welcome → lesson → source-grounded guide → inclusive activity → feedback → next steps. No farm access, sign-up or commitment to invest is required.

> **Draft content:** material in `content/` is sourced from public references but has **not been reviewed by a fisheries expert**. The app shows the draft review note. This prototype is a learning demonstration, not a source of live diagnosis or unsupported technical prescriptions.

## Setup

Use Node.js 24 and npm. For a fresh checkout:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000. Keep an existing settings file when returning to the project. Dependencies are already installed in the prepared hackathon workspace; automated phase work does not install packages or download browsers.

## Mock and live modes

- `GUIDE_MODE=mock` is the default. The guide uses deterministic lesson excerpts; feedback uses the authored rubric. No API key or OpenAI call is needed.
- Live mode requires `GUIDE_MODE=live`, `OPENAI_API_KEY`, and `OPENAI_MODEL` set to a Responses API model supporting structured outputs. Configure these yourself in `.env.local`; never commit or share that file. Restart the server after changing settings.
- A live-provider error uses the deterministic mock with `mode: "mock-fallback"`. Citations, rubric ids and next steps are checked against authored content. Unsupported guide questions use the authored limitation and next step.
- Unit and E2E tests explicitly use mock mode even if your personal settings select live mode. Browser tests block external requests; only the local app is contacted.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server on port 3000 |
| `npm run check` | Lint, typecheck and unit tests |
| `npm run verify` | Check plus production build |
| `npm run test` | Unit tests in mock mode |
| `npm run test:e2e` | Build and serve on port 3100, then run six mobile Playwright specs in mock mode |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |

On the Windows demo machine, E2E specs use the already-installed Microsoft Edge channel. On other platforms, they use preinstalled Playwright Chromium. No browser downloads run as part of the tests. The shared fixture applies the existing 375px mobile project settings and fails on browser errors or external requests.

The Windows Codex sandbox has a documented Next.js build limitation. Run `npm run check` inside it, and request approval to run `npm run verify` and `npm run test:e2e` outside it. See [AGENTS.md](AGENTS.md) and [build evidence](harness/build-log.md).

## Five-step demo

1. On `/`, select **I'm just curious about fish farming** and start the lesson. Show the authored learning stages, draft warning and a **Sources** disclosure.
2. On `/lesson`, answer the three understanding questions. Ask **Why does the dry season matter?** and tap the `wa-03` citation. Then ask **What dose of medicine should I give sick catfish?** to show the honest limitation, next step and absence of citations.
3. On `/activity`, show the three inclusive paths. The observe and questions paths reveal authored examples; the fictional path shows Amina's story and needs no farm access.
4. Submit **idk**, show the hint, and tap **Stuck?**. Retry with an authored example or a response to Amina's scenario, such as: **Amina's well ran low in the dry season. She needs to find out about testing the water.** Show the strength, considerations and chunk links.
5. Continue to `/next`. Show the recommended and other next steps, **Your session**, and the optional reminder preview labelled **Demo: reminders are not sent in this prototype**. Choose **Yes** to return. Reload to demonstrate saved progress; the welcome page offers **Continue where you left off**. **Start over** clears this app's progress and local event log.

## Local progress and metrics

`agri-progress-v1` stores intention, lesson/check progress, guide count, the activity draft/feedback, reminder opt-in and return preference on the device. Reloads resume progress when localStorage is available; blocked storage falls back to memory for the current page session.

`agri-events-v1` contains timestamped local events: `intention_chosen`, `lesson_viewed`, `check_answered`, `guide_asked`, `guide_unsupported`, `help_requested`, `activity_submitted`, `activity_completed`, and `would_return`. Events contain small choice/status fields, not question or answer text, and are never sent to an analytics service. Lesson viewed is recorded once per saved learning session; retries and changed choices append new events. Your session shows completed activity, current check score and return preference.

## Project structure

- `src/app/`: welcome, lesson, activity and next-step pages; guide, feedback and help API routes.
- `src/components/`: small interactive learning-flow components; server pages supply authored content.
- `src/lib/content/`: typed loaders, lesson parser and integrity checker.
- `src/lib/guide/`, `src/lib/feedback/`: mock/live providers and post-validation.
- `src/lib/progress.ts`, `src/lib/metrics.ts`: device progress and local events.
- `content/`: authored draft lesson, source list, activity and pathway.
- `tests/e2e/`: full loop, no-farm-access, stuck help, unsupported question, resume and 375px overflow specs.
- `tests/manual/`: the Phase 04 development-flow smoke script.
- `harness/`: phase specifications and observed build evidence.

## Editing learning material

Humans maintain the authored content; automated agents treat it as read-only. Follow [content/README.md](content/README.md) for frontmatter, chunk headings and source ids. Keep chunk ids stable, cite source ids from `sources.json`, and update rubric/pathway references consistently. Do not add technical prescriptions without cited support. Run the content integrity/unit tests and both verification suites after a human content edit. Agricultural content still needs expert review.

Product scope: [agritech-learning-brainstorm.md](agritech-learning-brainstorm.md). Phase status: [PLANS.md](PLANS.md).

## Known limitations

Content is draft, English-only and not expert-reviewed. Live answer quality requires a human smoke test with the configured model; passing mock tests does not establish live accuracy. There are no live reminders, accounts, shared progress, offline caching, full-cycle curriculum, live diagnosis or server-side response storage. Device storage may be unavailable or cleared. Willingness to return is a local self-report; **long-term retention is unproven**.

## Future possibilities

After review and learner validation: additional agricultural topics, locally reviewed translations, voice access, expert support and further inclusive activities. These are future possibilities, not implemented features. Deployment and GitHub push are handled by the human with approval.
