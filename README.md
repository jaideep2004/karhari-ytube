# Karhari Tube — Audio → YouTube / Facebook Video Uploader

> Standalone Next.js 15 project extracted from `nextjs-karharimedia` — only the social video pipeline.
> Homepage inspiration: [tunestotube.com](https://www.tunestotube.com/) — simple, functional, single-purpose.

## Quick Links
- `PRD.md` — Product requirements, user stories, acceptance criteria
- `PLAN.md` — Phased execution plan (P0 → P6)
- `DESIGN.md` — Design approach, homepage wireframe, tokens, AdSense slots
- `ARCHITECTURE.md` — Stack, auth, video pipeline, DB schema, API, infra
- `ADSENSE_CHECKLIST.md` — Pre-approval checklist
- `docs/USER_FLOWS.md` — Step-by-step flows with edge cases
- `docs/DATA_MODEL.md` — Collections, indexes, example docs
- `docs/API_SPEC.md` — Endpoints contract
- `docs/REUSE_FROM_PARENT.md` — What to copy from `nextjs-karharimedia`

## One-line Pitch
Upload an MP3 + thumbnail → pick Bars or Circular visualizer → choose YouTube channel or Facebook page → we generate a 1080p video and publish it.

## Project Status
Scaffold only (docs). No code yet. See `PLAN.md` P0 for bootstrap commands.

## Folder (after scaffold)
```
karhari-tube/
├── src/app/(public)/        # /, /how-it-works, /faq, /privacy, /terms, /contact
├── src/app/(auth)/dashboard # upload card, jobs, settings/connections
├── src/app/(auth)/admin     # KPIs, users, jobs
├── src/app/api/*            # auth, upload, jobs, admin
├── src/lib/video/           # copied: videoGeneration, circularVisualizer, connectors
├── src/lib/auth/            # next-auth config, token vault
├── public/ads.txt
└── docs/
```
