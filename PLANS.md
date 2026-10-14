# PLANS.md

Ordered phases. Run **one Codex `/goal` per phase** (texts in `PROMPTS.md`). The human approves between phases.

| # | Phase | Build file | Timebox | Status |
|---|---|---|---|---|
| 0 | Environment, content draft, harness (done by setup) | n/a | n/a | Complete |
| 1 | Content loader + offline-safe layout | `harness/build/phase-01-content-loader.md` | 30m | Complete |
| 2 | Guide API (source-grounded) | `harness/build/phase-02-guide-api.md` | 60m | Complete |
| 3 | Activity feedback + stuck help APIs | `harness/build/phase-03-feedback-help.md` | 45m | Complete |
| — | **Backend checkpoint:** human live smoke test, then GitHub push (approval) | n/a | 15m | Not started |
| 4 | Mobile learning-loop UI + saved progress | `harness/build/phase-04-learning-ui.md` | 90m | Complete |
| 5 | E2E tests, metrics, demo readiness | `harness/build/phase-05-e2e-demo.md` | 45m | Complete |

Statuses: `Not started`, `In progress`, `Blocked`, `Complete`.
