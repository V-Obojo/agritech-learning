# Phase 12: Lesson media, figure lightbox, lab framework + 3D catfish

**Status:** Not started

## Source inputs
`AGENTS.md` (performance and no-remote-assets rules), `content/README.md` (directives, media, labs), `content/media.json`, `content/labs.json` (lab `catfish-3d`), `content/fish-farming/meet-the-catfish/*`, `public/media/*`, the Phase 09 lesson layout, and the Phase 10 progress `labs` field.

## Objective
Lessons show real, credited, zoomable photos and embedded interactive labs. The first lab is a 3D African catfish learners can spin, zoom and explore. Topic 2 "Meet the African catfish" is fully live.

## In scope
1. **Content model:**
   - Extend the lesson parser or renderer to turn standalone `::figure <id>` and `::lab <id>` lines into structured blocks (e.g. `chunk.blocks: ({type:'text'}|{type:'figure',mediaId}|{type:'lab',labId})[]`).
   - Add zod schemas + loaders for `media.json` and `labs.json` (`getMedia(id)`, `getLab(id)`, `listLabs()`).
   - Integrity:
     - every directive id exists
     - every lab's chunk references exist in the lab's own topic
     - every media file exists in `public/media/`
     - every lab badge exists in `badges.json`
     - every lab sits in a live topic
   - Unit tests for all of this.
2. **`<Figure>`** (client):
   - Renders `next/image` with width/height from `media.json`, plus the caption and a credit line ("Photo: <credit> · <license>", linking `sourceUrl`/`licenseUrl`).
   - Click/tap opens a **lightbox**:
     - zoom (wheel, pinch, +/- buttons, double-tap)
     - pan (drag)
     - rotate (90° buttons and a free-rotate slider)
     - reset
     - keyboard: + - arrows R Esc
     - focus trap, `aria-modal`, closes on Esc and backdrop
   - No new deps; use CSS transforms + pointer events.
3. **Lab framework:**
   - `<LabFrame>` (title, instructions, a progress indicator against `completion` criteria, a "Completed!" state with badge pop, and a fullscreen toggle).
   - Lab components load via `next/dynamic` with `ssr:false` and a skeleton.
   - A registry mapping lab `type` → component; types without a component yet show a "coming soon" frame (Phase 13 fills them).
   - Lab state saves to `progress.labs[labId]` through the store API. Record events `lab_started`, `lab_progress` and `lab_completed` with `{ labId, subjectId, topicId }` (extend the metrics schema).
4. **`catfish-3d` lab** (type `model-viewer`, r3f + drei, lazy):
   - **Procedural African catfish** built from three.js geometry, following `labs.json.model.notes`:
     - an elongated cylindrical body (e.g. a `LatheGeometry` or tapered tube along a spline)
     - a flattened broad head
     - 4 pairs of barbels as thin tapered tubes (the maxillary pair longest)
     - a very long dorsal fin and anal fin (thin extruded shapes running almost to the tail)
     - pectoral fins with a highlighted spine ray, pelvic fins, and a rounded tail fin
     - marbled dark-to-light colouring (a vertex-colour gradient or a simple noise shader using `bodyColors`)
     - smooth, slightly glossy material

     Keep it under ~20k triangles. Add a gentle idle swim animation (body sway, barbel drift); stop it under reduced motion.
   - Controls: OrbitControls (drag to spin, wheel/pinch to zoom with min/max limits, damping), plus buttons for zoom in/out, reset view, auto-rotate toggle, and front/side/top preset views.
   - **Hotspots** from `labs.json.hotspots`: glowing markers anchored to named parts of the procedural model (`part` keys). Clicking one focuses the camera smoothly on it and shows a card with the label, text and a chunk citation chip linking `#<chunk>` in the lesson. Hotspots are also reachable as a keyboard-accessible list beside the canvas.
   - **Modes** (`labs.json.modes`): an Adult/Fingerling toggle animates the proportions (fingerling: relatively larger head and eyes, shorter body, more translucent fins). Show the mode `note` (it says proportions are approximate and not to scale).
   - Completion per `labs.json.completion` (visit ≥ N hotspots and view both modes). Saved to progress → feeds the badge.
   - A WebGL fallback: if WebGL is unavailable, show the `catfish-drawing` figure with an HTML hotspot overlay of the same hotspot data.
5. **Topic 2 live:** with the pages already content-driven, `meet-the-catfish` renders with its figures and lab. Check that the guide/feedback work for it (mock), the hub shows 4 live topics, and the next/previous topic links are right.
6. **`/labs` gallery** (teaser only): replace the placeholder with an animated card grid from `listLabs()`.
   - Each card shows a looping preview made of lightweight CSS/SVG motion (not the full 3D), the title, teaser and topic name, plus "Open in lesson" → `<topic basePath>#<chunk containing the lab>`.
   - Card states: "Completed ✓" if done, "Coming in a later update" for types not yet implemented.
7. **`/credits`:** every media item (thumbnail, caption, credit, license link, source link) and every source in `sources.json`. Link it in the footer.

## Non-goals
Simulators (Phase 13), dashboard changes beyond what the labs widget already reads.

## Acceptance criteria
- Unit tests: directive parsing (text/figure/lab ordering), the integrity checks above (fixtures), the lab progress reducer/completion logic, and hotspot data mapping.
- E2E (both projects):
  1. Topic 2: a figure shows its credit; open the lightbox → zoom in and rotate (assert the transform changed) → Esc closes.
  2. The 3D lab canvas renders (canvas present, no console errors). Dragging changes the camera (expose a `data-camera-azimuth` attribute or similar test hook). The hotspot list → selecting "Upper-jaw barbels" shows its text and an `mc-02` citation. Toggling Fingerling shows the mode note. Visiting 5 hotspots + both modes shows "Completed" and the progress has `labs['catfish-3d'].completed`.
  3. `/labs` lists 4 labs, and "Open in lesson" for the catfish lab lands on topic 2 at the lab.
  4. `/credits` lists all 10 media items.
  5. The three/r3f chunk is **not** requested on home or on topic 1 (assert via network log in e2e).
- No external requests (the fixture enforces this).
- `npm run verify` and `npm run test:e2e` pass.

## Required evidence
Test summaries, a triangle count of the procedural model, the bundle/network evidence for lazy loading, and screenshots of the 3D lab (adult + fingerling) under `test-results/phase-12/`, all in `harness/build-log.md`.

## Stop condition
Stop after the acceptance criteria are verified. Do not begin Phase 13.
