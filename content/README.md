# content/

Learning material for the prototype. **Codex and app code treat this folder as read-only.** Only humans (or the content author) edit it.

All files are `status: draft-unreviewed`: drafted from public sources on 2026-10-14, not yet reviewed by a fisheries expert. Replace or approve them before any real-world use. The UI must show a draft banner while status is `draft-unreviewed`.

| File | Purpose |
|---|---|
| `sources.json` | Source list. Every chunk cites ids from here. |
| `lessons/water-availability.md` | The lesson, split into citable chunks. |
| `activity.json` | The inclusive activity (3 paths) and the authored feedback rubric. |
| `pathway.json` | Intentions, stages, understanding check, stuck hints, next steps, unsupported fallback, reminder demo. |

## Lesson chunk format

```
---
<frontmatter: id, title, species, region, status, review_note, estimated_minutes>
---

## wa-01: Chunk title
sources: source-id-1, source-id-2

Body text (one or more paragraphs / bullet lists) until the next "## " heading.
```

- Chunk ids are stable (`wa-NN`). Never renumber; add new ids instead.
- Every chunk must cite at least one id from `sources.json`.
- No technical numbers (doses, thresholds, stocking rates) unless a cited source states them.
