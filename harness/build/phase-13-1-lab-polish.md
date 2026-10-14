# Phase 13.1: Lab and media polish (human review fix-up)

**Status:** Not started

## Source inputs
`AGENTS.md`, `content/labs.json`, the Phase 12–13 code in `src/components/labs/**`, `src/components/media/**` and `src/components/dashboard/**`, and the screenshots in `test-results/phase-12` and `phase-13`.

## Why
The human reviewed the Phase 12–13 screenshots. Everything works, but several things look unfinished on a laptop, where the demo happens.

## Fixes
1. **Labs are squeezed into the lesson's centre column** (~546px at 1440). The water simulator becomes about 2,600px tall.
   - On desktop (≥1024px), a `::lab` block **breaks out to the full container width**, spanning the TOC + lesson + guide columns. The sticky side columns end before it and resume after it, or the lab overlays them; choose the cleaner implementation.
   - Inside a lab, use a two-column layout on desktop:
     - controls/questions on the left, the visual (canvas/SVG/chart) on the right, sticky while scrolling the controls
     - water sim: source cards + month slider + questions left; tank scene + supply/need chart right
     - pond builder: inputs + readouts + challenges left; plan view + depth stick right
     - spot the signs: scene right (larger); element list + explanation left
     - 3D: the canvas larger (≥ 560px tall on desktop); hotspot list + info card beside it
   - Phones stay single-column.
2. **3D catfish fidelity.** The current model is a rough draft (4,660 triangles): flat polygon fins, a disc tail, a blob head. Improve it while staying procedural and under ~20k triangles:
   - The body: a smooth tapered cylinder along a gentle spline (LatheGeometry or a custom swept profile) that is laterally compressed towards the tail.
   - The head: broad and dorsoventrally **flattened**, blending into the body (not a separate sphere). Add a wide mouth line and small eyes set on the upper sides.
   - Barbels: tapered tubes with a slight curve. The maxillary pair is clearly longest and sweeps back.
   - **Dorsal and anal fins:** thin, continuous membranes with visible soft rays (lines or normal-mapped stripes) running from behind the head almost to the tail. Their edges follow the body curve, with slight transparency at the margins.
   - The tail fin is rounded with rays, and the pectoral fins show a clear spine on the leading edge.
   - Material: marbled dorsal colouring (procedural noise in a small shader or vertex colours) blending to a pale belly, with a subtle sheen.
   - **Fingerling mode must look clearly different:** a proportionally larger head and eyes, a shorter, chunkier body, more translucent fins, lighter colouring. Animate the morph between modes.
   - Lighting: a soft three-point setup with a faint ground shadow (contact shadow from drei is fine) and a gentle caustic or gradient background.
   - Keep the hotspot anchors attached to the new geometry, and record the new triangle count.
3. **The lightbox** isn't centred: the dialog hugs the left side and the "Rotation" label wraps to "Rotati / on".
   - Centre the dialog, with the image filling the available viewport at 90vw × 85vh.
   - Put the toolbar in one tidy row with icon buttons and tooltips/aria-labels; the rotation slider has a non-wrapping label.
   - Show the caption and credit under the image.
4. **Lab progress bars** use the browser's default bright green and grey. Style them with the design tokens (brand green fill, a soft track, rounded corners, animated fill), in light and dark.
5. **Dashboard citation chips are run together** ("wf-02wf-07"). Render each citation as a separate chip with spacing, everywhere chips appear.
6. **Spot-the-signs illustrations:** make the scenes richer while staying SVG:
   - fish with a catfish silhouette (flat head, barbels, long dorsal fin)
   - gentle ripples, light rays and banks with grass
   - animated bubbles for gasping fish
   - brown swirls for muddy water
   - clear hover/focus states on tappable elements

   Reduced motion still applies.
7. **Water sim:** "Play year" looks disabled when idle. Give it a normal button state, and show Pause while playing.

## Acceptance criteria
- At 1440px, each lab's container width is ≥ 1000px and its height is less than half of what it was (record before/after heights in the log). At 375px nothing scrolls sideways.
- The 3D model's triangle count is recorded (≤ 20k). Screenshots of adult vs fingerling show visibly different proportions. All e2e hotspot and mode tests still pass.
- The lightbox's bounding box is horizontally centred (±4px) at 1440 and 375, and the toolbar labels don't wrap.
- There are no unstyled `<progress>` elements (the e2e computed style uses the token colour).
- Citation chips are separate elements.
- `npm run verify` + `npm run test:e2e` pass on both projects. Save new screenshots to `test-results/phase-13-1/`.

## Stop condition
Stop after verification. Do not start Phase 14.
