# User Flows — Karhari Tube

## Flow A — Google user uploading to YouTube (happy path)
1. Visit `/` → see card.
2. Click `Continue with Google` → consent (youtube.upload) → redirect to `/dashboard` (card now authed).
3. Drop `song.mp3` → shows `3:42`, drop `cover.jpg` → preview.
4. Title auto-filled from filename, edit if needed. Pick `Bars / cyan`.
5. `Upload to` shows `YouTube ▾ My Channel (thumb)` pre-selected, Facebook shows `Connect Facebook →`.
6. Click `Create & Upload Video` → progress `Downloading → Generating → Uploading 82% 4.2/10 MB` → `Done youtu.be/abc [Copy]`.
7. Link appears in `/dashboard/jobs`.

## Flow B — Google user also wants Facebook
1. In card, click `Connect Facebook` (or Settings → Connections).
2. FB OAuth → `/me/accounts` fetched → Pages radio appears.
3. Now card shows both: `☑ YouTube` + `☑ Facebook` → both ticked → `Create` generates once, uploads twice → two links.

## Flow C — Facebook-only user (mirror of A)
- Same but channel picker is FB Pages. YouTube section shows `Connect Google →`.

## Flow D — Not signed in, tries to upload
- Card fields work, but `Create` is replaced by two big buttons: `Continue with Google` / `Continue with Facebook`.
- After OAuth, form state is preserved (store in sessionStorage before redirect).

## Flow E — Failure & Retry
- If YT quota exceeded → error `YouTube quota exceeded — try tomorrow or request increase` + Retry tomorrow.
- If generation fails (ffmpeg) → `Video generation failed: ...` + Retry (reuses cached R2 audio).
- If FB page token expired → `Reconnect Facebook` prompt.

## Flow F — Admin
1. Login with admin email → redirected to `/admin`.
2. See KPI cards, click user → see their jobs, click job → see per-destination status + error.

## Edge Cases
- No thumbnail → gradient BG `gradients=s=1920x1080:c0=0x0a0a16:c1=0x18102a...` (parent handles).
- Audio >200MB → client validation + `File too large` before upload.
- Schedule in future → `publishAt` passed to YT API; FB ignores (always published).
- Cancel mid-generation → AbortSignal kills ffmpeg, job marked `failed: Cancelled`.
