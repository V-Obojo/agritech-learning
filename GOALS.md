# GOALS.md

## Product
**Ovayi Farm**, a product of **Ovayi Foods**: a mobile-friendly learning companion that helps curious beginners in Nigeria explore farming, understand what an activity really involves, and find a sensible next step. No sign-up, no farm needed, no pressure to invest.

## Structure (all driven by `content/`)
```
Home (Ovayi Farm) ── asks "What brings you here?" once
 ├─ Animal farming (live)
 │   ├─ Fish farming (live) → fish hub: intro + 5-topic path
 │   │    1 What is fish farming, and is it for me?   (live)
 │   │    2 Meet the African catfish                    (coming soon)
 │   │    3 Water: do I have enough?                    (live)
 │   │    4 Space and setup options                     (coming soon)
 │   │    5 Time, costs and commitment                  (coming soon)
 │   └─ Poultry, Goats & sheep, Snails, Pigs            (coming soon)
 ├─ Crop farming (coming soon: vegetables, cassava, maize, rice, plantain)
 └─ Agro-processing (coming soon: garri & cassava products, palm oil, fish smoking & drying, feed making)
```

## Promise (fish farming)
Help someone curious about catfish farming, who may have no experience, site, equipment, or plans to invest, to:
1. understand what fish farming involves and whether it might suit them,
2. understand practical basics such as water availability,
3. identify a practical next step (including "not now").

## The core learning loop (per live topic, must work end to end)
1. Arrive from the fish hub (intention already chosen on home; changeable on the hub).
2. Read a short lesson (draft-labelled, with sources visible) and answer the understanding check.
3. Ask the AI guide a question and get a cited answer from **this topic's** chunks.
4. Attempt the topic's activity (including a fictional path for people without access or who'd rather not share).
5. Receive feedback tied to the rubric and lesson chunks.
6. See next steps; optional demo-only reminder; progress saved per topic on the device; hub shows topic status.

## Success conditions
- A first-time visitor can go Home → Animal farming → Fish farming → topic 1 → topic 3 without dead ends; coming-soon items are clearly labelled and never broken.
- A learner with **no farm access** can complete every live topic (fictional path).
- A learner who gets **stuck** can get help (authored hint + guide).
- Guide answers **cite chunk ids from the current topic**; questions outside the topic get an **honest limitation + next step**.
- Works on a 375px-wide phone screen; pages are lightweight; no images.
- Simple local metrics with `topicId`: activity completed, check score, "would you come back?".
- `npm run verify` and `npm run test:e2e` pass in mock mode.

## Constraints
- Content comes only from `content/` (draft, sourced, not expert-reviewed); never invent technical recommendations.
- One guide, source-grounded. Paths, topics and progression are authored in `content/`, never generated. No hardcoded topic ids, names or copy in app code.
- No sign-up; progress lives in localStorage.
- English only.

## Non-goals (prototype exclusions)
Live diagnosis, lessons for coming-soon topics/subjects/areas, peer groups, marketplace, live reminder delivery (SMS/WhatsApp/email), offline/PWA, accounts, translations, voice.
