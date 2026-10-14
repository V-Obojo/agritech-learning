# PLANS.md

Ordered phases. Run **one Codex `/goal` per phase** (texts in `PROMPTS.md`). The human approves between phases.

| # | Phase | Build file | Timebox | Status |
|---|---|---|---|---|
| 0 | Environment, content draft, harness (done by setup) | n/a | n/a | Complete |
| 1 | Content loader + offline-safe layout | `harness/build/phase-01-content-loader.md` | 30m | Complete |
| 2 | Guide API (source-grounded) | `harness/build/phase-02-guide-api.md` | 60m | Complete |
| 3 | Activity feedback + stuck help APIs | `harness/build/phase-03-feedback-help.md` | 45m | Complete |
| 4 | Mobile learning-loop UI + saved progress | `harness/build/phase-04-learning-ui.md` | 90m | Complete |
| 5 | E2E tests, metrics, demo readiness | `harness/build/phase-05-e2e-demo.md` | 45m | Complete |
| R | **Restructure prep (done by Claude):** Ovayi Farm catalog, fish path, topic 1 content, per-topic content layout | n/a | n/a | Complete |
| 6 | Multi-topic content model + APIs | `harness/build/phase-06-multi-topic-model.md` | 60m | Complete |
| 7 | Ovayi Farm navigation + per-topic UI | `harness/build/phase-07-navigation-ui.md` | 90m | Complete |
| 8 | E2E + demo polish for the full journey | `harness/build/phase-08-journey-e2e.md` | 45m | Complete |
| — | Live smoke test, then GitHub push (human, approval) | n/a | 15m | Not started |

Statuses: `Not started`, `In progress`, `Blocked`, `Complete`.

**Note for Phase 6:** the content layout changed in step R (`content/pathway.json`, `content/activity.json` and `content/lessons/` no longer exist), so `npm run check` is expected to fail at the start of Phase 6 until the loaders are migrated.
