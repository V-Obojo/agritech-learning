# content/

Learning material for **Ovayi Farm** (by Ovayi Foods). **Codex and app code treat this folder as read-only.** Only humans (or the content author) edit it. App code must read names, ids, copy and structure from here, never hardcode them.

All files are `status: draft-unreviewed`: drafted from public sources on 2026-10-14, not yet reviewed by a fisheries expert. The UI must show a draft banner on lessons while status is `draft-unreviewed`.

## Layout

```
content/
  catalog.json              product name/parent/pitch, intentions, areas → subjects (status: live | coming-soon)
  sources.json              shared source list; every chunk cites ids from here
  <subject>/                one folder per live subject (subject.path in catalog.json), e.g. fish-farming/
    path.json               subject intro + ordered topics (status: live | coming-soon)
    <topic-id>/             one folder per LIVE topic
      lesson.md             the lesson, split into citable chunks
      topic.json            welcome by intention, starterQuestions, synonyms, understandingCheck,
                            stuckHints, nextSteps, defaultNextStep, unsupportedFallback, reminder
      activity.json         activity paths + authored feedback rubric
```

Coming-soon areas, subjects and topics have no folders; they appear in catalog/path only.

## Lesson chunk format

```
---
<frontmatter: id, title, species, region, status, review_note, estimated_minutes>
---

## wa-01: Chunk title
sources: source-id-1, source-id-2

Body text (one or more paragraphs / bullet lists) until the next "## " heading.
```

- Chunk ids are stable and **prefixed per topic** (`wf-` = what-is-fish-farming, `wa-` = water). Never renumber; add new ids instead.
- Every chunk must cite at least one id from `sources.json`.
- No technical numbers (doses, thresholds, stocking rates, prices) unless a cited source states them.
- `stuckHints` keys: `lesson`, `guide`, and `activity-<pathId>` for every path in that topic's `activity.json`.
- `synonyms` (topic.json) map learner phrasing to lesson wording for the mock guide's retrieval only.
