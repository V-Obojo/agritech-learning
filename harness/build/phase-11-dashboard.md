# Phase 11: Customizable dashboard, streaks and badges

**Status:** Not started

## Source inputs
`AGENTS.md`, `GOALS.md`, `content/badges.json`, `content/labs.json`, `content/catalog.json`, the subject `path.json` files, the Phase 10 DB/session/progress/events code, and `recharts`.

## Objective
A signed-in learner opens `/dashboard` and sees a lively, personal overview of their learning. They can customize which widgets show and in what order, and the layout is saved to their account.

## In scope
1. **Pure calculators** (`src/lib/insights/`, unit-tested, no React):
   - `computeStreak(events, now, timeZone='Africa/Lagos')` → `{ current, longest, activeDays: string[] }`. A day counts if any learning event happened.
   - `computeBadges(badgesJson, progress, events, liveTopics, now)` → earned/locked badges with an earned date. Support every rule type listed in `badges.json`'s `note`, driven by content (no badge ids in code).
   - `computeTopicStats(progress, paths)` → per subject/topic: status, check score, activity done, labs done.
   - `computeActivitySeries(events, days=14)` → daily counts for the chart.
   - `estimateLearningMinutes(progress, topics)` → uses each lesson's `estimated_minutes` for viewed topics, plus 3 minutes per completed lab. Label it "estimate" in the UI.
2. **Widgets** (`src/components/dashboard/*`), each a self-contained card:
   - `continue`: the last path + next recommended topic CTA
   - `progress`: animated rings per subject and per topic
   - `streak`: flame counter, a calendar strip of the last 14 days
   - `badges`: an earned grid with a pop animation, locked badges greyed with their description
   - `activity-chart`: a Recharts bar/area chart of the last 14 days, lazy-loaded
   - `answers`: the learner's saved activity answers + feedback strengths per topic, with links back
   - `guide-history`: recent questions, supported/not covered, and citations
   - `labs`: per-lab status/score with "Open lab" links
   - `checks`: understanding-check scores per topic
   - `time`: the learning-time estimate
   - `profile`: name, state, intention, a member-since date, and an "Edit profile" link
3. **Customization:**
   - An "Customize" mode toggles show/hide per widget and reorders them by drag-and-drop (pointer + keyboard: focus a widget, use the arrow buttons). No new deps; use native pointer events or HTML5 DnD with a keyboard alternative.
   - "Reset layout".
   - The layout is persisted to `dashboard_prefs` via `GET`/`PUT /api/me/dashboard` (zod: a known widget id list + visibility).
   - The default layout covers every widget in a sensible order.
4. **Layout:** a responsive grid (12 columns desktop, with widgets declaring their span: e.g. continue 8, streak 4, progress 6, badges 6, chart 8, time 4…; 1 column on mobile). Entrance stagger animation. Skeleton loaders while data loads. Empty states that encourage action ("Start your first topic" → hub).
5. **Data:** the dashboard server component loads the session user, progress, events (last 90 days), guide history (last 20), prefs and content, then passes them to client widgets. There are no client-side fetches for the initial render, except chart lazy-loading.
6. **Badge celebration:** when a new badge is earned anywhere in the app (signed-in or guest), show a small toast ("Badge earned: Water Wise") with an animation. Track already-celebrated badges in progress to avoid repeats.

## Non-goals
Labs implementation (Phases 12–13; the labs widget reads whatever `progress.labs` contains), social features, admin analytics.

## Acceptance criteria
- Unit tests for every calculator, including:
  - a streak across the Lagos midnight boundary
  - a broken streak
  - each badge rule type (fixtures)
  - activity series gaps
  - the time estimate
- E2E (both projects, temp DB):
  1. Sign up → complete topic 1 → the dashboard shows topic 1 done, the "First Steps" and topic-completion badges (ids read from `badges.json` in the test), and streak 1.
  2. Customize: hide the activity chart, move badges to first → reload → the layout persists → reset restores the default.
  3. The dashboard has no horizontal scroll at 375 and 1440.
- The chart bundle is not loaded on non-dashboard pages (check network/JS in e2e or a build-output note).
- `npm run verify` and `npm run test:e2e` pass.

## Required evidence
Test summaries, the widget list, and screenshots at 1440/375 under `test-results/phase-11/`, listed in `harness/build-log.md`.

## Stop condition
Stop after the acceptance criteria are verified. Do not begin Phase 12.
