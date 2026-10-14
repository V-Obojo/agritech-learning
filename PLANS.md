# PLANS.md

Ordered phases. Run **one Codex `/goal` per phase** (texts in `PROMPTS.md`). The human approves between phases.

| # | Phase | Build file | Timebox | Status |
|---|---|---|---|---|
| 0–5 | v0 single-topic loop (setup → e2e) | `harness/build/phase-01..05-*.md` | — | Complete |
| R, 6–8 | Ovayi Farm restructure: catalog, fish path, multi-topic model, navigation, journey e2e | `harness/build/phase-06..08-*.md` | — | Complete |
| — | Baseline pushed to https://github.com/V-Obojo/agritech-learning | — | — | Complete |
| V | **v2 prep (done by Claude):** libraries installed, 10 licensed photos, topics 2 + 4 content, labs/media/badges registries, harness | n/a | n/a | Complete |
| 9 | Design system + responsive, animated shell | `harness/build/phase-09-design-system.md` | 2–3h | Complete |
| 10 | Accounts + database + progress sync | `harness/build/phase-10-auth-db.md` | 2–3h | Not started |
| 11 | Customizable dashboard, streaks, badges | `harness/build/phase-11-dashboard.md` | 2h | Not started |
| 12 | Lesson media, lightbox, lab framework + 3D catfish | `harness/build/phase-12-media-3d.md` | 3h | Not started |
| 13 | Simulators: water source, pond builder, spot the signs | `harness/build/phase-13-simulators.md` | 3h | Not started |
| 14 | Full-journey e2e, performance, a11y, docs | `harness/build/phase-14-polish-e2e.md` | 2h | Not started |
| — | Deploy (Vercel + Turso) with guidance, push (human, approval) | n/a | 30m | Not started |

Statuses: `Not started`, `In progress`, `Blocked`, `Complete`.

**Note for Phase 9:** content changed in step V (4 live topics, `::figure`/`::lab` directives, new registries). Some existing tests will fail until Phase 9 updates them.
