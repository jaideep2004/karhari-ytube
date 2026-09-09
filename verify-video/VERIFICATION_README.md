# Karhari Tube - Google OAuth Verification Video

## Video Files
- **Final with burned captions (RECOMMENDED FOR SUBMISSION)**: `Karhari_Tube_OAuth_Verification_Final.mp4`
  - 1920x1080, 60fps, H.264 CRF 18, AAC 192k
  - Captions burned-in (bottom-center, not obscuring URL bar)
  - Voiceover synchronized per timestamped script
  - Duration: 425.417s (7:05)

- **No-burn version (optional)**: `Karhari_Tube_OAuth_Verification_NoBurn.mp4`
  - Same but without burned captions, with sidecar SRT
  - Use if Google prefers separate caption track

- **Sidecar captions**: `verify-video.srt` (SRT) and `verify-video.ass` (styled ASS)
- **Voiceover only**: `voiceover.wav` (48kHz stereo, -16 LUFS)

## Verification Details Demonstrated
- Application: Karhari Tube (Karhari Media Pvt. Ltd.)
- Domain: karharimedia.org
- OAuth Client ID visible in address bar at 01:02-01:13
- Scopes: youtube.upload, youtube.readonly, youtube, email/profile/openid
- Consent screen expanded at 01:26-01:43 with detailed voiceover justification
- End-to-end upload flow: Create Video -> Jobs (10%-49%) -> 50%-79% -> Uploading YouTube 80%-92% -> Done Ok 100% -> Open job -> YouTube link -> Playback
- Upload history at 06:51-07:05

## Google Submission Tips Applied
- 1080p sharp (client_id readable when paused)
- Clear English voiceover (Edge TTS en-US-AndrewNeural, minimal background noise)
- Captions match voiceover verbatim, bottom-center
- No music bed obscuring voice

## How Voiceover Was Placed
Each segment's TTS is placed at exact script start time via ffmpeg adelay, with silence gaps computed to next segment start. Two tight segments (Terms @ 00:36, Privacy @ 00:43) use +25% and +10% rate to fit windows without overlap.

Generated: 2026-09-08T19:30:37.412818
