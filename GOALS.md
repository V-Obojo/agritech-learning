# GOALS.md

## Product
**Ovayi Farm**, a product of **Ovayi Foods**: a responsive, animated, hands-on learning web app that helps curious beginners in Nigeria explore farming, understand what it really involves, and find a sensible next step. It works beautifully on laptops and phones.

## Structure (all driven by `content/`)
```
Home (Ovayi Farm) ── asks "What brings you here?"
 ├─ Animal farming
 │   ├─ Fish farming → hub: intro + 5-topic path
 │   │    1 What is fish farming, and is it for me?   (live)
 │   │    2 Meet the African catfish                    (live: 3D catfish lab, photos)
 │   │    3 Water: do I have enough?                    (live: water-source sim, spot-the-signs lab, photos)
 │   │    4 Space and setup options                     (live: pond builder lab, photos)
 │   │    5 Time, costs and commitment                  (coming soon)
 │   └─ Poultry, Goats & sheep, Snails, Pigs            (coming soon)
 ├─ Crop farming (coming soon)
 └─ Agro-processing (coming soon)
Top nav: Learn · Labs (teaser gallery) · Dashboard · Sign in / Sign up · theme toggle
Accounts: /signup · /signin · /account (profile) · /dashboard (customizable) · /credits
```

## The learning loop (per live topic)
1. Lesson with sources, zoomable credited photos, and embedded interactive labs.
2. Understanding check.
3. AI guide answers from **this topic's** chunks, with citations; honest "not covered" otherwise.
4. Activity (including a fictional path) → rubric-based feedback.
5. Next steps, an optional demo reminder, and progress saved (device for guests, account when signed in).

## Success conditions
- **Looks and feels modern on a laptop** (1280–1440px) and on phones (375px): multi-column desktop layouts, smooth entrance/scroll animations, no sideways scrolling, reduced-motion respected.
- **Accounts:**
  - Sign up / sign in / sign out work.
  - Profile edits, password change and delete account work.
  - "Forgot password?" shows "Contact the admin" with `catalog.product.supportContact`.
  - Guest progress merges into the account on sign-up/sign-in.
  - Progress follows the user after signing out and back in.
- **Dashboard:**
  - Widgets can be shown, hidden and reordered, and that layout persists per user.
  - It shows continue-learning, progress rings, streak, badges (from `badges.json`), an activity chart, the user's answers, guide history, lab results and check scores.
- **Labs** are genuinely interactive and complete-able:
  - 3D catfish: spin, zoom, hotspots, fingerling/adult toggle.
  - Water-source simulator.
  - Pond builder with measuring tape and live area/volume.
  - Spot-the-signs observation scenes.

  Results feed the dashboard and badges. `/labs` shows teaser previews that link into the lessons.
- **Photos** zoom/pan/rotate in a lightbox and always show credit + license. `/credits` lists all media and sources.
- The guide cites chunk ids; questions outside the content get the honest limitation.
- `npm run verify` and `npm run test:e2e` (desktop + mobile) pass in mock mode.

## Constraints
- Content comes only from `content/`. Never invent technical recommendations. Simulator numbers are illustrative and labelled.
- No hardcoded ids, names or copy in app code.
- English only.
- Everything is served locally (no remote assets).

## Non-goals
- Email delivery (password-reset emails, reminders)
- OAuth/social login
- Lessons for coming-soon items
- Payments, marketplace, peer groups
- Offline/PWA
- Translations, voice
