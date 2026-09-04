# API Spec — Karhari Tube

Base: `/api` — all JSON unless multipart. Auth via Auth.js session cookie (or `Authorization: Bearer` for service calls).

## Auth
- `GET /api/auth/session` — next-auth session
- `POST /api/auth/signin/google` / `facebook` — start OAuth
- `GET /api/auth/youtube/channels` — list authed user's YT channels (requires Google linked)
  → `200 { channels: [{id, title, thumbnailUrl}] }` / `401 not linked`
- `GET /api/auth/facebook/pages` — list FB pages
  → `200 { pages: [{id, name, picture}] }`

## Upload
- `POST /api/upload/audio` — multipart `audio` (mp3/wav/flac ≤200MB)
  → `200 { r2Key, r2Url, duration, fileSize }` — also supports presigned flow: `POST /api/upload/audio/presign` → `{url, key}`
- `POST /api/upload/artwork` — multipart `artwork` (jpg/png/webp ≤15MB) → same
- Rate-limit: 20 req/min/IP

## Jobs
- `POST /api/jobs` — body:
  ```json
  {
    "audioR2Key": "audio/.../a.mp3",
    "artworkR2Key": "artwork/.../c.jpg",
    "title": "My Song",
    "artist": "Karhari",
    "preset": "bars",
    "color": "cyan",
    "visibility": "public",
    "scheduleAt": null,
    "destinations": [
      {"platform":"youtube","channelId":"UCxxx"},
      {"platform":"facebook","pageId":"123"}
    ]
  }
  ```
  → `201 { jobId }` — enqueues
- `GET /api/jobs?page=1&limit=20&status=done` → `{jobs:[], pagination:{total,page,limit,totalPages}}`
- `GET /api/jobs/:id` → `{job}` with `progress` + `destinations`
- `POST /api/jobs/:id/cancel` → `200 {status:"failed"}`
- `GET /api/jobs/:id/poll` — alias for GET job (for simple polling)

## Admin (requires role=admin)
- `GET /api/admin/stats?range=30d` → `{ visits, users:{total,active7d}, jobs:{total,done,failed,byPlatform:{youtube,facebook}}, uploadsPerDay:[{date,count}] }`
- `GET /api/admin/users?page&search` → `{users:[{email,name,provider,jobsCount,lastActive}], pagination}`
- `GET /api/admin/jobs?page&status&platform&search` → same as jobs but all users

## Webhooks (future)
- `POST /api/webhooks/youtube` — not needed in v1 (we poll processing status instead)
