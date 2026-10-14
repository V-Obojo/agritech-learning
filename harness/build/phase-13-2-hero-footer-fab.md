# Phase 13.2: New hero, proper footer, floating guide button

**Status:** Not started

## Source inputs
`content/catalog.json` (new fields `heroHeadline`, `heroSubhead`, `supportContact` already present), `src/components/welcome-flow.tsx`, `src/components/site-footer.tsx`, `src/components/site-nav.tsx`, `src/components/guide-panel.tsx`, `src/components/lesson-tools.tsx` and the lesson page/layout at `src/app/[area]/[subject]/[topic]/page.tsx`.

## Why
Human review of the laptop demo:
1. The product is now **Stars Farming Academy** (by Ovayi Foods). The site nav wordmark already picks this up from content.
2. The home hero shouldn't repeat the product name as the big headline. The nav already shows the name — the hero should sell what the site is.
3. The current footer is one line. The site needs a proper footer.
4. The lesson's guide panel sits in a cramped right column on desktop. It should be a **floating button at the bottom right** of lesson pages that opens the guide in a panel/sheet. The sticky right column goes away.

## Scope
1. **Schema.** In `src/lib/content/schemas.ts`, extend the `product` object with `heroHeadline` (text), `heroSubhead` (text), `supportContact` (text). All three are present in `content/catalog.json`; add them to the schema and the inferred `Catalog` type.
2. **Hero** (`welcome-flow.tsx`):
   - Replace the `h1` from `catalog.product.name` with `catalog.product.heroHeadline`.
   - The `.lead` becomes `catalog.product.heroSubhead`.
   - Remove the `.hero-pitch` paragraph (or keep only if it still adds something after the subhead).
   - The eyebrow stays as `heroEyebrow`.
   - Keep the two CTAs ("Start learning →", "Explore labs").
3. **Footer** (`site-footer.tsx` and matching CSS):
   - A 4-column desktop layout (collapses to 1 column on phones) with a top divider:
     - Column 1: wordmark `catalog.product.name`, "by {parent}", a short tagline (reuse `catalog.product.tagline`), `supportContact` as a mailto link.
     - Column 2 — **Learn:** links to Home (`/`), Labs (`/labs`), Dashboard (`/dashboard`), Credits (`/credits`).
     - Column 3 — **Account:** Sign in (`/signin`), Sign up (`/signup`), My account (`/account`). Protected routes keep working as they do today.
     - Column 4 — **About:** a short "What this is" paragraph (one sentence from `heroSubhead` or similar), and the source line "Content drawn from FAO and Nigerian research. Expert review ongoing." (shown here only, not in the UI anywhere else).
   - A bottom bar: `© {year} {parent}. All rights reserved.` on the left, a right-aligned "Content under CC BY-SA where applicable · Media credits" linking `/credits`.
   - Semantic `<footer>`, `<nav aria-label="Footer">` sections, sensible headings, keyboard-accessible, visible focus.
4. **Floating guide button + sheet** (lesson pages only):
   - Remove the sticky right column that holds the guide and the `.lesson-tools` area. The lesson now uses a two-column desktop layout: TOC (left) and lesson body (center, wider), or whatever the cleanest content width is.
   - On every live-topic lesson page, render a **`<GuideFab>`** anchored to `position: fixed; bottom: 24px; right: 24px` (safe-area aware on mobile). Pill-shaped button with the brand green, a chat/dot icon, and the label **"Ask the guide"**. Keyboard focusable, `aria-haspopup="dialog"`, `aria-expanded` state, visible focus ring.
   - Clicking it opens a **sheet/dialog** containing the existing `GuidePanel` + the "Stuck?" help (lesson step). On desktop (≥1024px), the sheet opens as a side panel 420–480px wide, docked to the right, with a backdrop that does NOT dim the lesson (or a very light scrim), so you can still read the lesson. On phones (<1024px), it opens as a bottom sheet taking ~85vh.
   - Focus trap inside the sheet while open, Esc closes, restore focus to the FAB, `aria-labelledby` on the dialog title.
   - The FAB has a small badge-dot when the sheet has unread content (optional; leave off if time is tight).
   - The existing citation chip behaviour (scrolling the lesson to `#chunkId`) must still work from inside the sheet; closing the sheet on citation click is fine on mobile, keep open on desktop.
   - Preserve all `/api/guide` interactions, mock/live behavior, stuck help, and keyboard/accessibility tests.

## Non-goals
Changing the guide API, labs, dashboard, auth, or any content beyond the hero rename.

## Acceptance
- `npm run check` passes.
- `npm run verify` passes (outside the sandbox).
- `npm run test:e2e` passes on both projects. Existing tests that assert the hero h1 content or the right-column guide placement will need targeted updates (keep intent; prefer roles/labels).
- New e2e cases:
  - The home `h1` is **not** the product name (the nav still has the product name).
  - The footer has four columns on desktop (≥1024px), with Learn, Account and About headings; collapses on 375px.
  - The lesson page has a visible "Ask the guide" button fixed to the bottom-right at 1440 and 375.
  - Clicking it opens a dialog containing the guide question textarea; Esc closes it; focus returns to the FAB.
  - A citation chip from inside the dialog scrolls the lesson to `#wa-03` on the water topic.
- No horizontal scroll at 375, 768, 1280, 1440.
- Save a before/after lesson screenshot pair under `test-results/phase-13-2/`.

## Stop condition
Stop after verification. Do not start push/deploy.
