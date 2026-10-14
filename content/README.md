# content/

Learning material for **Ovayi Farm** (by Ovayi Foods). **Codex and app code treat this folder as read-only.** Only humans (or the content author) edit it. App code must read names, ids, copy and structure from here, never hardcode them.

Content was drafted from public sources (FAO, WorldFish, Nigerian research, Wikimedia Commons media) on 2026-10-14. The `status`/`review_note` fields are internal metadata and are **not shown in the UI**. Sources are always shown on lessons.

## Layout

```
content/
  catalog.json              product (name, parent, tagline, pitch, supportContact), intentions, areas → subjects
  sources.json              shared source list; every chunk cites ids from here
  media.json                openly licensed images in public/media/ with alt, caption, credit, license, sourceUrl
  labs.json                 interactive lab definitions (model-viewer, water-simulator, pond-builder, observation)
  badges.json               badge definitions + computation rules
  <subject>/                one folder per live subject (subject.path in catalog.json), e.g. fish-farming/
    path.json               subject intro + ordered topics (status: live | coming-soon)
    <topic-id>/             one folder per LIVE topic
      lesson.md             the lesson, split into citable chunks, with optional directives
      topic.json            welcome by intention, starterQuestions, synonyms, understandingCheck,
                            stuckHints, nextSteps, defaultNextStep, unsupportedFallback, reminder
      activity.json         activity paths + authored feedback rubric
```

## Lesson chunk format

```
---
<frontmatter: id, title, species, region, status, review_note, estimated_minutes>
---

## wa-01: Chunk title
sources: source-id-1, source-id-2

Body text (paragraphs / "- " bullet lists) until the next "## " heading.

::figure <mediaId>        ← standalone line: show an image from media.json (zoomable, credited)
::lab <labId>             ← standalone line: embed an interactive lab from labs.json
```

- Chunk ids are stable and **prefixed per topic** (`wf-` what-is-fish-farming, `mc-` meet-the-catfish, `wa-` water, `so-` setup-options). Never renumber; add new ids instead. Chunk ids are unique across all topics.
- Every chunk must cite at least one id from `sources.json`.
- No technical numbers (doses, thresholds, stocking rates, prices) unless a cited source states them.
- Directives must reference existing ids in `media.json` / `labs.json`.
- `stuckHints` keys: `lesson`, `guide`, and `activity-<pathId>` for every path in that topic's `activity.json`.
- `synonyms` (topic.json) map learner phrasing to lesson wording for the mock guide's retrieval only.

## Labs (`labs.json`)

Each lab has `id`, `type`, `title`, `teaser` (for the /labs gallery), `subjectId`, `topicId` (the lesson where it is fully interactive), `badge`, `instructions`, type-specific config, and `completion` criteria. Every fact a lab shows carries a `chunk` reference into its topic. Simulator numbers are illustrative and the lab must display its `exampleNote`.

## Media (`media.json`)

Images are Wikimedia Commons files (CC0, CC BY-SA or public domain). Every display must show `credit` + `license` (linking `licenseUrl`/`sourceUrl`), and all media appear on `/credits`. The user's own photos can be added with the same fields.
