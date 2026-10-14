# GOALS.md

## Promise
Help someone curious about catfish farming in Nigeria, who may have no experience, site, equipment, or plans to invest, to:
1. understand the basics of **water availability**,
2. consider whether fish farming suits their circumstances,
3. identify a practical next step.

## The core learning loop (must work end to end)
1. Choose an intention (curious / considering / student).
2. Read a short lesson (draft-labelled, with sources visible).
3. Ask the AI guide a question and get a cited answer.
4. Attempt the activity via one of three paths: observe a real source, list questions, or a fictional scenario.
5. Receive feedback tied to the rubric and lesson chunks.
6. See a next step; optionally opt in to a (demo-only) reminder; progress is saved on the device and resumes after reload.

## Success conditions
- A learner with **no farm access** can complete the loop (fictional or questions path).
- A learner who gets **stuck** can get help (authored hint + guide).
- Guide answers **cite chunk ids** that exist; questions outside the content get an **honest limitation + next step**.
- Works on a 375px-wide phone screen; pages are lightweight.
- Simple local metrics: activity completed, understanding-check score, "would you come back?" answer.
- `npm run verify` and `npm run test:e2e` pass in mock mode.

## Constraints
- Content comes only from `content/` (draft, sourced, not expert-reviewed); never invent technical recommendations.
- One guide, source-grounded. Learning stages and progression are authored in `content/pathway.json`, never generated.
- No sign-up; progress lives in localStorage.
- English only.

## Non-goals (prototype exclusions)
Live diagnosis, full farming-cycle curriculum, peer groups, marketplace, multiple agricultural activities, live reminder delivery (SMS/WhatsApp/email), offline/PWA, accounts, translations, voice.
