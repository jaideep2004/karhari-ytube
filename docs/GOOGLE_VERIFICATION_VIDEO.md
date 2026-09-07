# Google OAuth Verification Video — Karhari Tube (Karhari Media)

> **Goal:** Get `youtube.upload / youtube.readonly / youtube` approved. Record on **live `https://`** domain, not `localhost`.

---

## 0) Before you record

- [ ] Deploy to live domain: `https://client-livedomain.com` with `/privacy` and `/terms` live (we built them — just deploy `src/app/privacy` + `src/app/terms`)
- [ ] Branding matches video: **App name = `Karhari Tube`** (in `console.cloud.google.com/auth/branding`)
- [ ] Branding URLs are `https://client-livedomain.com`, `/privacy`, `/terms` (no localhost)
- [ ] Credentials has both origins: `http://localhost:3000` + `https://client-livedomain.com` and redirect URIs `/api/auth/callback/google`
- [ ] Revoke app at `myaccount.google.com/permissions` so consent screen shows again
- [ ] Prepare a 5-10 sec MP3 + 1 JPG cover (small file = fast upload)
- [ ] Use Chrome, full window, **show full address bar**, 1080p, mic on, no background music

---

## 1) Video specs

- Length: **2–4 min**, English voiceover, screen + voice
- Host as **Unlisted YouTube video** → paste link in `console.cloud.google.com/auth/branding` verification form
- No cuts that hide URL bar. No `localhost` in bar.

---

## 2) Script — read this while recording

### 0:00 — Intro (homepage)
> "This is Karhari Tube by Karhari Media — https://karharimedia.org — a tool that turns any audio file and cover image into a 1080p video and uploads it to the user's own YouTube channel."

- Show homepage, Karhari Media logo. Scroll to footer → click **Privacy** → show page live → back → click **Terms**.

### 0:20 — OAuth flow (must show consent)
1. Click **Continue with Google**
2. Pick Google account
3. **Pause 3 sec on Google OAuth consent screen** so reviewer reads:
   - `youtube.upload`
   - `youtube.readonly`
   - `youtube`
   - `userinfo.email / profile` (if requested)
4. Click **Allow**

> Say: "We request these scopes to list the user's channels and upload the video they created."

### 0:50 — Demo each scope

**A. `youtube.readonly` + `youtube` → List channels**
> "We use read-only access to list the user's own YouTube channels so they can choose where to upload."
- Show channel picker loading (`/api/auth/youtube/channels`) → select a channel.

**B. `youtube.upload` → Upload**
> "We generate a 1080p video with ffmpeg and upload it to the channel the user selected. This is user-initiated."
- Upload MP3 + JPG → pick Bars/Circular → **Create Video** → show job progress → show final link `youtube.com/watch?v=...`
- Open that link in new tab → show video playing on YouTube → open **YouTube Studio → Content** → new video is there.

### 2:30 — Limited use + revoke
> "We only use YouTube data to generate and upload the video the user requested. We don't share, sell, or train AI on this data."
- Go to **Dashboard → Settings → Connections → Disconnect Google**
- Open `myaccount.google.com/permissions` → show Karhari Tube can be removed there too.

### 2:50 — Outro
- Re-show **Privacy Policy** → highlight YouTube API Services disclosure + `privacy@karharimedia.com`
> "Our Privacy Policy at /privacy explains this and links to Google Privacy Policy and YouTube Terms."

Stop recording.

---

## 3) Submission — justification text (paste verbatim)

**youtube.upload:**
> Karhari Tube generates a 1080p video from the user's audio and thumbnail (ffmpeg) and uploads it to the YouTube channel the user explicitly selects. This is the core feature and is only executed when the user clicks Create & Upload.

**youtube.readonly / youtube:**
> To list the user's own channels via youtube/v3/channels?mine=true so they can choose the upload destination. Read-only, no other channel data accessed.

**Why narrow scopes not enough:**
> `youtube.upload` alone does not allow listing channels for destination picker; `youtube.readonly` is required for mine=true.

---

## 4) Rejection checklist — avoid these

| Rejected for | Fix |
|---|---|
| `localhost` in address bar | Record on live `https` domain |
| Consent screen skipped | Revoke before recording to force consent |
| Scope not actually used in video | Must show real upload + video on YouTube |
| App name mismatch | Video homepage must say `Karhari Tube` exactly |
| No audio / Private video | Unlisted + clear English voiceover |
| Privacy not linked | Footer must link to live `/privacy` without login |

---

## 5) After upload

1. Upload to YouTube as **Unlisted**
2. Paste link in `OAuth consent screen → Verification` form
3. Submit. Review is ~3–7 days (sensitive scopes) → watch email for `noreply@google.com`.

---

**File:** `docs/GOOGLE_VERIFICATION_VIDEO.md`  
**Brand:** Karhari Media • Product: Karhari Tube • Updated: 2026-09-02
