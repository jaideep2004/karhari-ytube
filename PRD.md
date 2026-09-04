# PRD — Karhari Tube

**Version:** 0.1 • 2026-08-28 • Owner: GDS Creatives / Karhari Media
**Reference:** tunestotube.com (simple & functional) + parent `nextjs-karharimedia` social video pipeline

---

## 1. Problem
Artists/labels have MP3 + artwork but need a video to publish on YouTube / Facebook. Manual editing in Premiere/DaVinci is slow. TunesToTube solves this for YouTube-only with a static-image video; client wants same simplicity but with animated visualizers (bars/circular) and dual-platform (YT + FB) plus channel/page picker.

## 2. Goals
- G1: Any visitor can create a YouTube or Facebook video in <60s from audio+image.
- G2: Google-auth users can pick from their own YouTube channels; Facebook-auth users pick from their own Pages.
- G3: Cross-platform: Google user can link Facebook and upload to both (and vice versa).
- G4: Admin sees visits, users, upload counts.
- G5: Site passes Google AdSense review and earns from public pages.

## 3. Non-Goals (v1)
- No DSP distribution (Spotify/Apple etc.), no royalties, no Broma, no payouts.
- No video editing timeline, no multi-track album, no SoundCloud.
- No mobile app, no team workspaces.

## 4. Personas
- **P1 Artist (primary):** Has MP3/WAV + cover art, wants quick YT upload with bars visualizer.
- **P2 Label manager:** Manages 2-3 FB Pages + 1 YT channel, wants to push same audio to both.
- **P3 Admin:** Needs to monitor growth, debug failed uploads.

## 5. User Stories & Acceptance Criteria

### US1 — Signup with Google or Facebook
- As visitor, I can click "Continue with Google" or "Continue with Facebook" on homepage/card.
- AC: OAuth consent shows scopes (YT) `youtube.upload` + `youtube.readonly` or (FB) `pages_show_list,pages_read_engagement,pages_manage_posts`. On success, redirected to `/dashboard` with session.
- AC: If email already exists with other provider, accounts are linked (not duplicated).

### US2 — Upload Audio + Thumbnail
- As authed user, I can drag-drop MP3/WAV/FLAC (≤200MB) and JPG/PNG/WEBP (≤15MB).
- AC: Audio shows duration via ffprobe; thumbnail shows preview. Missing thumbnail falls back to gradient (no error).
- AC: Files upload to R2 immediately (signed URL or direct), returns r2Key.

### US3 — Choose Visualizer
- As user, I can pick `Bars` (default, waveform at bottom) or `Circular` (360-bar ring) + color `cyan|green|pink|purple|red|white`.
- AC: Small thumbnail preview updates on selection (static image, not live render).

### US4 — Choose Destination(s)
- If Google-linked: I see radio list of my YouTube channels (thumbnail + name). If Facebook-linked: radio list of my Pages.
- AC: If only one provider linked, other section shows `Connect Facebook to enable` (or vice versa) with one-click OAuth link.
- AC: I can tick both YT and FB if both linked → same video uploads twice.

### US5 — Generate & Publish
- On `Create & Upload`:
  AC: Job created, UI shows progress `Downloading 0-25% → Generating 25-65% → Uploading 65-100%` with byte progress where available.
  AC: On success, show `youtu.be/<id>` and/or `facebook.com/<page>/videos/<id>` with copy + open.
  AC: On failure, show reason + Retry.

### US6 — Job History
- As user, I can see `/dashboard/jobs` list (date, title, visualizer, destinations, status, links).
- AC: Polling or SSE updates live job without refresh.

### US7 — Admin Dashboard
- As admin, I see:
  AC: KPI cards — total visits (30d), total users, total videos generated, success rate, by-platform pie.
  AC: Users table — email, provider(s), jobs count, last active.
  AC: Jobs table — all jobs filterable by status/platform/date.
  AC: Access restricted to `role=admin`.

### US8 — AdSense
- As visitor on public pages (/, /how-it-works, /faq), I see ad slots that don't overlap content.
- AC: No ads on /login, /dashboard/*, /admin/*.
- AC: `ads.txt`, `/privacy`, `/terms`, `/contact`, `/about` exist before review. Site has ≥1000 words original content.

## 6. Functional Requirements

| ID | Requirement |
|---|---|
| F1 | Google OAuth with YouTube scopes + refresh-token rotation |
| F2 | Facebook OAuth with Pages scopes + long-lived token + /me/accounts listing |
| F3 | R2 storage for audio/artwork/social-videos |
| F4 | Video generation via ffmpeg: `bars` (showwaves) + `circular` (canvas 800x800 → rawvideo → libx264) |
| F5 | Resumable YouTube upload (5MB chunks, 308 resume) |
| F6 | Facebook R2-bridge upload (`file_url`) |
| F7 | Persisted `VideoJob` (not in-memory Map) + progress polling |
| F8 | Rate-limit uploads (e.g. 20/hour/IP) |
| F9 | Admin RBAC + aggregated stats |

## 7. Non-Functional
- N1 Performance: generation ≤ realtime×1.2 (3-min song → ≤4 min render on Render starter).
- N2 Reliability: chunk retry 3×, token auto-refresh, job survives restart.
- N3 Security: tokens encrypted at rest, signed R2 URLs, no secrets in logs.
- N4 SEO: Core Web Vitals green, sitemap, OG tags.
- N5 Compliance: YouTube quota (1600/upl), FB App Review, GDPR cookie consent.

## 8. Constraints
- ffmpeg cannot run on Vercel serverless — must use Render/Fly/Cloud Run worker or single Docker host.
- YouTube daily default 10k quota ≈ 6 videos/day until increase approved — apply early.
- Facebook `pages_manage_posts` requires Business verification (1-2 wks).

## 9. Success Metrics (30d post-launch)
- ≥500 uploads, ≥60% YT success rate, <5% FB failure, AdSense approved within 4 wks.

## 10. Open Questions
- Pricing/free limits? (3 free then paywall vs unlimited with ads)
- Custom domain name? `tube.karharimedia.com` vs new domain
- Single Docker host for v1 vs split Vercel+worker?
