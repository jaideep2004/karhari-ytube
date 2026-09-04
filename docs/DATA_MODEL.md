# Data Model — Karhari Tube

## Collections

### users
```js
{
  _id: ObjectId,
  email: "a@b.com",              // unique, sparse
  name: "Jaideep",
  image: "https://lh3.../photo.jpg",
  role: "user" | "admin",
  google: {
    sub: "1100...",               // Google account id
    email: "a@gmail.com",
    accessTokenEnc: "aes:...",
    refreshTokenEnc: "aes:...",
    expiresAt: ISODate,
    picture: "https://..."
  },
  facebook: {
    userId: "1015...",
    accessTokenEnc: "aes:...",
    pages: [{ id: "123", name: "Karhari Music", accessTokenEnc: "aes:...", picture: "..." }]
  },
  createdAt: ISODate,
  updatedAt: ISODate,
  lastLoginAt: ISODate
}
```
Indexes: `{email:1} unique sparse`, `{ "google.sub":1 } sparse`, `{ "facebook.userId":1 } sparse`, `{role:1}`

### videoJobs
```js
{
  _id: ObjectId,
  userId: ObjectId,              // ref users
  status: "queued"|"downloading"|"generating"|"uploading"|"done"|"failed",
  input: {
    audioR2Key: "audio/<userId>/abc.mp3",
    artworkR2Key: "artwork/<userId>/cover.jpg", // optional
    title: "My Song",
    artist: "Karhari",
    preset: "bars"|"circular",
    color: "cyan",
    visibility: "public"|"unlisted"|"private",
    scheduleAt: ISODate | null
  },
  output: {
    r2VideoKey: "social-videos/<jobId>.mp4",
    r2Url: "https://pub-xxx.r2.dev/social-videos/<jobId>.mp4",
    duration: 212.4,
    fileSize: 10485760
  },
  destinations: [
    { platform: "youtube", channelId: "UCxxx", externalId: "dQw4w9WgXcQ", videoUrl: "https://youtu.be/dQw4w9WgXcQ", status: "done", error: null },
    { platform: "facebook", pageId: "123", externalId: "9876", videoUrl: "https://facebook.com/123/videos/9876", status: "failed", error: "quota" }
  ],
  progress: { phase: "uploading", pct: 82, bytes: 8400000, total: 10400000, updatedAt: ISODate },
  error: null | "No audio file",
  createdAt: ISODate,
  updatedAt: ISODate
}
```
Indexes: `{userId:1, createdAt:-1}`, `{status:1}`, `{ "destinations.platform":1 }`, `{createdAt:-1}`

### analyticsEvents
```js
{ _id: ObjectId, type: "page_view"|"upload_started"|"upload_succeeded"|"upload_failed", userId?: ObjectId, path?: "/", platform?: "youtube", jobId?: ObjectId, createdAt: ISODate }
```
Indexes: `{type:1, createdAt:-1}`, `{path:1}`

## R2 Keys
- `audio/<userId>/<uuid>.<ext>` — original MP3
- `artwork/<userId>/<uuid>.<ext>` — thumbnail
- `social-videos/<jobId>.mp4` — generated video (cache, kept)
