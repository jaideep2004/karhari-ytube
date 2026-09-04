# ARCHITECTURE — Karhari Tube

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 App Router + React 19 + TypeScript | Same as parent, Vercel-optimized for AdSense CWV |
| UI | Tailwind CSS (or MUI 7 if you prefer parent's MUI) | Tailwind faster for simple card; keep MUI for admin DataGrid if needed |
| Auth | Auth.js v5 (next-auth) | Google + Facebook + linking, already used in parent |
| DB | MongoDB Atlas (native `mongodb` driver) | Copy parent repositories verbatim; alternative: Prisma+Postgres |
| Storage | Cloudflare R2 (`@aws-sdk/client-s3`) | Reuse `server/src/services/storage/r2Provider.ts` |
| Video | `fluent-ffmpeg` + `ffmpeg-static` + `@napi-rs/canvas` | Reuse `videoGeneration` + `circularVisualizer` 1:1 |
| Deploy (v1) | **Single Render Docker** (Next standalone + ffmpeg) | Simplest, ffmpeg works. v2 split Vercel+worker if needed |

## 2. High-Level Diagram

```
[Browser] → [Next.js (or Render Docker)]
              ├─ / (public) — card + ad slots
              ├─ /api/auth/* — Auth.js callbacks
              ├─ /api/upload/* — R2 presigned → upload
              ├─ /api/jobs — create + poll
              ├─ /api/admin/* — stats
              └─ [Video Worker (same process in v1)]
                    resolveMedia → generateVideo (ffmpeg) → cacheVideoToR2
                    → youtubeConnector (chunked 5MB) / facebookConnector (R2 file_url)
                    → persist VideoJob.destinations

[R2 Bucket: karhari-tube]
  audio/<userId>/<uuid>.mp3
  artwork/<userId>/<uuid>.jpg
  social-videos/<jobId>.mp4

[MongoDB Atlas]
  users, videoJobs, analyticsEvents
```

## 3. Auth Flow

```
Sign in with Google → OAuth → callback
  → find user by google.sub OR email
  → if exists by email with FB → link google sub to same user
  → store {accessTokenEnc, refreshTokenEnc, expiresAt}
  → session JWT {userId, role}

Sign in with Facebook → OAuth → callback
  → exchange code for short token → extend to 60d long-lived
  → GET /me/accounts → pages[] → store pages[].accessTokenEnc
  → same linking logic

Connect other provider (when already authed):
  /dashboard/settings/connections → "Connect Facebook" → OAuth with session → link to current userId (not new user)
```

Token refresh: on job start, `refreshSocialToken()` checks `expiresAt` → `POST oauth2.googleapis.com/token` with refresh_token → update `users.google.accessTokenEnc`.

Channel/Page listing:
```
GET /api/auth/youtube/channels → youtube/v3/channels?part=snippet&mine=true + Authorization: Bearer <token>
GET /api/auth/facebook/pages   → graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,picture
```

## 4. Video Pipeline (extracted)

**Copy these files from parent (minimal edits):**
- `server/src/services/videoGeneration.service.ts` → `src/lib/video/videoGeneration.ts` (fix LOGO_PATH, SOCIAL_VIDEO_DIR → `path.join(tmpdir(),'social-videos')`)
- `server/src/services/circularVisualizer.service.ts` → `src/lib/video/circularVisualizer.ts` (no edit)
- `server/src/services/dsp/connectors/youtubeConnector.ts` → `src/lib/video/youtubeConnector.ts` (remove DspConnector wrapper, keep resumableUpload)
- `server/src/services/dsp/connectors/facebookConnector.ts` → `src/lib/video/facebookConnector.ts` (keep R2 bridge)
- `server/src/services/storage/r2Provider.ts` → `src/lib/storage/r2Provider.ts`
- `server/src/types/socialMedia.ts` → `src/types/socialMedia.ts`

**Queue → VideoJob collection (persisted):**
- `POST /api/jobs` validates, creates `VideoJob {status: queued, progress: 0}`, then `void processJob(jobId)` (or BullMQ / pgboss if you add queue later).
- `processJob`: `resolveMedia` (R2/local) → `generateVideo` (bars/circular) → `cacheVideoToR2` → `uploadAll` (parallel per destination) → update `destinations[]` → `status: done|failed`.

## 5. Data Model (summary — see docs/DATA_MODEL.md)

```
users { _id, email, name, image, role, google{ sub, accessTokenEnc, refreshTokenEnc, expiresAt }, facebook{ userId, accessTokenEnc, pages[] }, createdAt }
videoJobs { _id, userId, status, input{ audioR2Key, artworkR2Key, title, artist, preset, color }, output{ r2VideoKey, duration, fileSize }, destinations[{platform, channelId/pageId, externalId, videoUrl, status, error}], progress{phase,pct,bytes,total}, createdAt, updatedAt }
analyticsEvents { _id, type: page_view|upload_started|upload_succeeded|upload_failed, userId?, path?, platform?, createdAt }
```

## 6. API Surface (summary — see docs/API_SPEC.md)

```
POST /api/upload/audio            (multipart or presigned)
POST /api/upload/artwork
GET  /api/auth/youtube/channels
GET  /api/auth/facebook/pages
POST /api/jobs                     {audioR2Key, artworkR2Key, title, artist, preset, color, destinations:[{platform, channelId/pageId}], visibility, scheduleAt}
GET  /api/jobs                    ?page&limit&status
GET  /api/jobs/:id
POST /api/jobs/:id/cancel
GET  /api/admin/stats
GET  /api/admin/users
GET  /api/admin/jobs
```

## 7. Infra & Env

```
# .env.local
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=https://tube.karharimedia.com
GOOGLE_CLIENT_ID= / GOOGLE_CLIENT_SECRET=
FACEBOOK_CLIENT_ID= / FACEBOOK_CLIENT_SECRET=
R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID= / R2_SECRET_ACCESS_KEY= / R2_BUCKET_NAME=karhari-tube / R2_PUBLIC_DOMAIN=pub-xxxxx.r2.dev
NEXT_PUBLIC_R2_PUBLIC_DOMAIN=pub-xxxxx.r2.dev
FFMPEG_PATH= / FFPROBE_PATH=  (or ffmpeg-static)
```

**Dockerfile (single host v1):**
```docker
FROM node:20-bullseye
RUN apt-get update && apt-get install -y ffmpeg
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm","start"]
```

## 8. Security
- Encrypt tokens at rest (AES-256-GCM, key in env `TOKEN_ENCRYPTION_KEY`).
- Signed R2 URLs (1h expiry), no public list.
- Rate-limit `/api/jobs` (20/hour/IP via `mongoRateLimit`).
- No secrets in client bundle, `server-only` for connectors.

## 9. Observability
- `console.log` with `[YouTube]`/`[FB]` tags (as parent) + optional Sentry.
- Admin job detail shows `error` + `attempts` for debugging.

## 10. AdSense Infra
- `public/ads.txt`, `next/script` for `adsbygoogle.js`, `AdSlot` component gated to public routes only.
