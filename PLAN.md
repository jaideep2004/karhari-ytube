# PLAN — Karhari Tube (Phased)

**Source pipeline:** `nextjs-karharimedia/server/src/services/{videoGeneration,circularVisualizer,socialUpload,dsp/connectors/{youtube,facebook}}`
**Homepage ref:** tunestotube.com — simple, functional, card-centered

---

## Phase 0 — Scaffold (2-3 days) — THIS FOLDER
- [x] Docs scaffold (you are here)
- [ ] `npx create-next-app@latest karhari-tube --ts --app --tailwind` (or MUI if preferred)
- [ ] `npm i next-auth@beta mongodb @aws-sdk/client-s3 @aws-sdk/s3-request-presigner fluent-ffmpeg @napi-rs/canvas`
- [ ] Copy `.env.example` (GOOGLE_*, FACEBOOK_*, MONGODB_URI, R2_*, NEXTAUTH_SECRET)
- [ ] `public/ads.txt` placeholder, `src/app/{privacy,terms,contact,about}/page.tsx` shells
- [ ] Verify `npm run build` + `npx tsc --noEmit` green
- **Exit gate:** `PLAN.md` reviewed, project name locked, hosting decision (single Render Docker vs Vercel+worker).

## Phase 1 — Auth + Storage (3 days)..................
- Auth.js v5: Google (youtube.upload + readonly) + Facebook (pages_*), JWT session, linking by email/providerAccountId.
- User model + encrypted token vault (reuse `dspCredentialVault` AES pattern).
- R2 provider (`r2Provider.ts` copy) — audio/artwork upload via presigned URL or server proxy.
- Header with `Sign in with Google/Facebook`, landing placeholder.
- **Exit gate:** Can sign in with each provider separately, R2 upload works, `/api/auth/youtube/channels` + `/api/auth/facebook/pages` return lists.

## Phase 2 — Upload Card (Homepage functional core) (3 days)
- Central 720px card on `/` (when authed) + `/dashboard` fallback — fields: audio drop, artwork drop, title/artist, visualizer radios + color, destination checkboxes.
- DESIGN.md wireframe implemented; no ads on card.
- Tailwind or MUI — keep TunesToTube density but modern whitespace.
- File validation + duration probe (client-side via <audio> or server ffprobe).
- **Exit gate:** Card matches DESIGN.md mock, file upload to R2 verified via curl HEAD.

## Phase 3 — Video Generation (4 days) — HEAVIEST
- Copy `videoGeneration.service.ts` + `circularVisualizer.service.ts` verbatim (fix `LOGO_PATH`).
- Worker route: `POST /api/jobs` creates `VideoJob` queued → `processJob` does `resolveMedia` → `generateVideo` → `cacheVideoToR2`.
- For v1 single-host: run inside same Next server but guarded `if (!LOCAL_FFMPEG_ENABLED) throw`.
- Progress via polling `GET /api/jobs/:id`.
- **Exit gate:** 3-min MP3 + JPG → bars video 1080p succeeds end-to-end locally, `R2 social-videos/<jobId>.mp4` exists.

## Phase 4 — Platform Connectors (4 days)
- Port `youtubeConnector.ts` (chunked 5MB resumable) + `facebookConnector.ts` (R2 file_url) — strip `DspDeliveryPayload` wrapper.
- Channel/Page pickers wired to auth listings.
- `uploadAll` equivalent: generate once, upload N destinations in parallel.
- Persist `socialDeliveries` to `VideoJob.destinations[]`.
- **Exit gate:** YT test upload to own channel + FB test upload to test Page both return externalIds.

## Phase 5 — Cross-link + Dual Upload + Polish (2 days)
- Settings `/dashboard/settings/connections` — Connect other provider, unlink, refresh.
- Dual checkbox logic + parallel upload.
- Circular preset full QA (Hindi font fallback).
- Job history `/dashboard/jobs` + detail with links + retry.
- **Exit gate:** Google-only user can link FB and upload to both in one click.

## Phase 6 — Admin + Analytics + AdSense (2-3 days)
- `role=admin` seed + middleware guard.
- `AnalyticsEvent` via Next middleware (page_view), aggregated stats for `/admin`.
- KPI cards + users table + jobs table (MUI DataGrid or simple table).
- Public pages content (≥1000 words), `ads.txt`, ad slots on `/` after card, no ads on auth'd routes.
- Sitemap, OG, cookie banner.
- **Exit gate:** Admin can answer "how many users, which users, how many videos" + AdSense application submitted.

## Phase 7 — Hardening & Launch
- YouTube quota increase request + FB App Review submission.
- Rate limiting, Sentry/logging, R2 lifecycle, cleanup cron.
- Single Docker deploy to Render (Dockerfile with ffmpeg).
- **Exit gate:** End-to-end demo recorded, docs updated, handover.

---

## Milestone Calendar (approx 15-18 dev days)
| Week | Phases |
|---|---|
| W1 | P0+P1+P2 |
| W2 | P3+P4 |
| W3 | P5+P6+P7 |

## Reuse Map
See `docs/REUSE_FROM_PARENT.md` for exact files to copy and edits.

## Risks & Mitigations
- **ffmpeg on Vercel fails** → use Render Docker (mitigated by design).
- **YT quota 6/day too low** → apply for increase at P1 start, not P7.
- **FB review delay** → submit at P2 with screencast.
- **Video generation slow** → add job queue + background tick if needed (defer to P7).
