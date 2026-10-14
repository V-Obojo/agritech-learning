# Build log

Observed progress and verification evidence. **Append-only**: add corrections as new entries; never rewrite history. Record real command results only.

## Phase summary

| Phase | Status | Started | Completed | Evidence | Blockers |
|---|---|---|---|---|---|
| 0 Setup | Complete | 2026-10-14 | 2026-10-14 | `npm run verify` green on scaffold | none |
| 1 Content loader | Not started | | | | |
| 2 Guide API | Not started | | | | |
| 3 Feedback + help | Not started | | | | |
| 4 Learning UI | Not started | | | | |
| 5 E2E + demo | Not started | | | | |

## Entry template

```
### <YYYY-MM-DD HH:MM> — Phase NN — <short title>
- Status change: <from> → <to>
- Scope worked on:
- Files changed:
- Tests added:
- Verification: <exact command> → <observed result summary>
- Limitations:
- Blockers / questions for human:
- Next action:
```

## Entries

### 2026-10-14 — Phase 00 — Environment, content draft, harness
- Status change: Not started → Complete
- Scope: git init (repo-local identity), Next.js 16.4 scaffold (TS, App Router, Tailwind v4, src/), deps `openai`, `zod`, `vitest`, `@playwright/test`, `@types/node@24`; scripts `typecheck` (`next typegen && tsc --noEmit`), `test`, `test:e2e`, `verify`; `.env.example`; draft content in `content/` (6 sources, 10 lesson chunks, activity, pathway); harness files.
- Verification: `npm run verify` → lint ok, typecheck ok, vitest (no tests, passWithNoTests), `next build` ok.
- Limitations: content is draft, not expert-reviewed. `unrs-resolver` postinstall is blocked by npm allowScripts (lint still passes). Removed `next/font/google` (Geist) from the layout during setup, because it needs network at build time.
- Sandbox findings (Codex CLI 0.162.0, Windows build 26300):
  - The legacy elevated sandbox, launched from a non-interactive helper, failed with "setup refresh had errors".
  - The MXC sandbox works (`MXC_OK`). Inside MXC, lint/typecheck/vitest run fine, but `next build` fails: Turbopack "Failed to write app endpoint /page"; webpack `EPERM mkdir .next/server/...`. Isolated mkdir probes succeed, so this looks like a multi-process build issue.
  - Decision: iterate with `npm run check` in the sandbox; run `npm run verify` / `test:e2e` outside the sandbox with approval.
- Next action: run the Phase 01 goal from PROMPTS.md.
