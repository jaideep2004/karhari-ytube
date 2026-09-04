# Reuse from Parent — `nextjs-karharimedia`

Copy these verbatim, then apply noted edits.

| Parent Path | New Path | Edits |
|---|---|---|
| `server/src/services/videoGeneration.service.ts` | `src/lib/video/videoGeneration.ts` | Change `SOCIAL_VIDEO_DIR` to `path.join(os.tmpdir(),'karhari-tube','social-videos')` for Vercel compat; fix `LOGO_PATH` to `public/images/logo.png` if you add one; keep `hindiFontSpec` |
| `server/src/services/circularVisualizer.service.ts` | `src/lib/video/circularVisualizer.ts` | None |
| `server/src/services/dsp/connectors/youtubeConnector.ts` | `src/lib/video/youtubeConnector.ts` | Remove `implements DspConnector`, `BaseDspConnector`; expose `async uploadToYouTube(videoPath,title,desc,token,visibility,scheduleAt,onProgress,signal): Promise<string>` directly |
| `server/src/services/dsp/connectors/facebookConnector.ts` | `src/lib/video/facebookConnector.ts` | Same — expose `async uploadToFacebook(videoPath,title,desc,pageId,token,onProgress,signal): Promise<string>` |
| `server/src/services/dsp/connectors/trackDescription.ts` | `src/lib/video/trackDescription.ts` | Keep `buildTrackDescription` |
| `server/src/services/storage/r2Provider.ts` | `src/lib/storage/r2Provider.ts` | Update default bucket to `karhari-tube`; keep `getR2Key`, `generateSignedUploadUrl`, `objectExists`, `publicUrl` |
| `server/src/types/socialMedia.ts` | `src/types/socialMedia.ts` | Keep as-is |
| `server/src/config/constants.ts` (SOCIAL_VIDEO_DIR) | `src/lib/config.ts` | Redefine `SOCIAL_VIDEO_DIR` for new app |
| `server/src/services/dsp/dspCredentialVault.ts` | `src/lib/auth/tokenVault.ts` | Rename to tokenVault, keep `encryptCredentialMap/decryptCredentialMap` for token at-rest encryption |
| `server/src/utils/fileUpload.ts` (getR2Key logic) | merged into r2Provider | No separate file |

**Do NOT copy:** `socialUpload.service.ts` (in-memory Map) — replace with persisted `VideoJob` + `processJob` (see ARCHITECTURE.md §4).

**Env to replicate:** `R2_*`, `YOUTUBE_CLIENT_ID/SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `FACEBOOK_CLIENT_ID/SECRET` — parent already has `GOOGLE`/`YOUTUBE` split; new app uses same Google OAuth app for both auth + YouTube scopes.
