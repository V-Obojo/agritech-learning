# Fish Farming Basics (agritech-learning)

Hackathon prototype: a mobile-friendly learning companion that helps curious beginners in Nigeria understand **water availability for catfish farming**, ask a source-grounded AI guide, try an inclusive activity, and get feedback, with progress saved on the device.

> **Draft content:** the lesson material in `content/` was drafted from public sources (FAO, WorldFish, Nigerian research) and has **not** been reviewed by a fisheries expert.

Product spec: [agritech-learning-brainstorm.md](agritech-learning-brainstorm.md). The build is run phase by phase with Codex: see [PLANS.md](PLANS.md) and [PROMPTS.md](PROMPTS.md).

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in OPENAI_API_KEY / OPENAI_MODEL, set GUIDE_MODE=live
npm run dev
```

Without a key (or with `GUIDE_MODE=mock`), the guide and feedback use a deterministic offline mock.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run verify` | Lint + typecheck + unit tests + build (the quality gate) |
| `npm run test` | Unit tests (mock mode) |
| `npm run test:e2e` | Playwright e2e at a 375px mobile viewport (mock mode) |

## Backend smoke test (PowerShell, dev server running)

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/guide -ContentType 'application/json' -Body '{"question":"Why does the dry season matter for a fish pond?"}' | ConvertTo-Json -Depth 6
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/guide -ContentType 'application/json' -Body '{"question":"What dose of medicine should I give sick catfish?"}' | ConvertTo-Json -Depth 6
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/feedback -ContentType 'application/json' -Body '{"pathId":"fictional","response":"Her well ran low last dry season and nobody has tested the water."}' | ConvertTo-Json -Depth 6
```

Check that `mode` is `live` when your key is configured, and that the second answer is `supported: false`.
