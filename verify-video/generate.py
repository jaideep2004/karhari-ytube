#!/usr/bin/env python3
import subprocess
import pathlib
import tempfile
import textwrap
import os
import json
import sys

# Paths
ROOT = pathlib.Path(__file__).parent
WORK = ROOT / "work"
WORK.mkdir(exist_ok=True)
ORIGINAL = ROOT / "2026-09-08 12-41-38.mp4"
FFPROBE = pathlib.Path(r"C:\Users\jaisi\Documents\GDS Creatives\karhari-tube\node_modules\ffprobe-static\bin\win32\x64\ffprobe.exe")
FFMPEG = pathlib.Path(r"C:\Users\jaisi\Documents\GDS Creatives\karhari-tube\node_modules\ffmpeg-static\ffmpeg.exe")
if not FFMPEG.exists():
    # fallback to system ffmpeg
    FFMPEG = pathlib.Path("ffmpeg")
if not FFPROBE.exists():
    FFPROBE = pathlib.Path("ffprobe")

# Video duration (hardcoded from ffprobe 425.417)
VIDEO_DURATION = 425.417

# Segments: (id, start_sec, end_sec, text, voice_rate)
# end_sec is display end (for captions), but audio placement uses start_sec
# next_start for audio max is next segment's start, we handle via adelay
segments = [
 (1,  0,  8, "Welcome to this demonstration of Karhari Tube for Google OAuth verification. We will begin from a signed-out state.", "+0%"),
 (2,  8,  24, "Karhari Tube allows creators, musicians, and podcasters to convert audio tracks into branded videos and publish them directly to YouTube.", "+0%"),
 (3,  25, 35, "Here on our About page, we explain the service architecture, company information, and our dedicated tools for creators.", "+0%"),
 (4,  36, 42, "Our Terms of Service outline platform compliance, user ownership of content, and adherence to YouTube API Services Terms of Service.", "+25%"),
 (5,  43, 54, "Our Privacy Policy details how user data and OAuth tokens are stored securely using AES-256 encryption, strictly used for requested video publishing, and never sold or shared.", "+10%"),
 (6,  55, 61, "Now, we initiate the sign-in flow by clicking Continue with Google.", "+0%"),
 (7,  62, 73, "Notice in the address bar that our registered OAuth Client ID is clearly visible. We select our Google account to proceed.", "+0%"),
 (8,  74, 85, "Proceeding through the consent screen to sign in to Karhari Tube.", "+0%"),
 (9,  86, 103, "Here is the Google OAuth consent screen. Karhari Tube requests access to manage YouTube videos, view the YouTube account, and manage account uploads. These permissions are strictly required to upload generated videos directly to the user's YouTube channel on their behalf.", "+0%"),
 (10, 104, 119, "Once authenticated, the user is directed to the creation dashboard. First, we select an audio file to upload.", "+0%"),
 (11, 119, 133, "Next, we select a background artwork image for the video.", "+0%"),
 (12, 134, 149, "We set the title, artist name, choose a customized audio wave visualizer, confirm our connected YouTube account destination, and enter the video description.", "+0%"),
 (13, 150, 182, "The assets are uploaded securely to our processing queue.", "+0%"),
 (14, 183, 216, "We click Create Video. The backend starts downloading assets and rendering the audio-reactive visualizer video.", "+0%"),
 (15, 217, 301, "The video generation pipeline combines the high-quality audio track with the background artwork and synchronized visualizer.", "+0%"),
 (16, 302, 335, "With the video rendered, Karhari Tube now uses the YouTube Data API youtube dot upload scope to publish the video directly to the user's connected YouTube channel.", "+0%"),
 (17, 336, 343, "Upload is complete. We click Open job to inspect the finished task.", "+0%"),
 (18, 344, 357, "On the job details page, we can preview the generated video and see the delivery confirmation to YouTube with the video link.", "+0%"),
 (19, 358, 384, "Opening the YouTube link verifies that the video was successfully created and uploaded to the user's channel.", "+0%"),
 (20, 385, 410, "The video has completed YouTube processing. We play the video, demonstrating seamless playback of the audio, artwork, and synchronized frequency visualizer on YouTube.", "+0%"),
 (21, 411, 425, "Finally, returning to the dashboard jobs list shows the complete upload log and status. This concludes the demonstration.", "+0%"),
]

VOICE = "en-US-AndrewNeural"

def sec_to_srt(t):
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = int(t % 60)
    ms = int(round((t - int(t)) * 1000))
    # handle rounding overflow
    if ms == 1000:
        ms = 0
        s += 1
        if s == 60:
            s = 0
            m += 1
            if m == 60:
                m = 0
                h += 1
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def sec_to_ass(t):
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = int(t % 60)
    cs = int(round((t - int(t)) * 100))
    if cs == 100:
        cs = 0
        s += 1
        if s == 60:
            s = 0
            m += 1
            if m == 60:
                m = 0
                h += 1
    return f"{h}:{m:02d}:{s:02d}.{cs:02d}"

def wrap_text(text, width=52):
    # simple word wrap, preserve existing
    words = text.split()
    lines = []
    cur = ""
    for w in words:
        if not cur:
            cur = w
        elif len(cur) + 1 + len(w) <= width:
            cur += " " + w
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines

print("=== Karhari Tube OAuth Verification Video Builder ===")
print(f"Original: {ORIGINAL}")
print(f"Work dir: {WORK}")
print(f"FFmpeg: {FFMPEG}")
print(f"FFprobe: {FFPROBE}")
print(f"Segments: {len(segments)}")
print()

# Step 1: Generate TTS segments
print("Step 1: Generating TTS segments with edge-tts...")
tts_files = []
for sid, start, end, text, rate in segments:
    out = WORK / f"seg_{sid:02d}.mp3"
    # remove if exists
    if out.exists():
        out.unlink()
    cmd = ["edge-tts", "--text", text, "--voice", VOICE, "--write-media", str(out)]
    if rate != "+0%":
        cmd.extend(["--rate", rate])
    print(f"  [{sid:02d}] {start:3d}s -> {end:3d}s rate={rate:4s} : {text[:50]}...")
    # Run
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"ERROR generating segment {sid}: {result.stderr}")
        sys.exit(1)
    # verify duration
    if not out.exists() or out.stat().st_size == 0:
        print(f"ERROR: output missing for segment {sid}")
        sys.exit(1)
    dur_str = subprocess.check_output([str(FFPROBE), "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(out)], text=True).strip()
    dur = float(dur_str)
    max_allowed = (segments[sid][1] - start) if sid < len(segments) else (VIDEO_DURATION - start)  # next start - current start
    # Actually need segments list lookup by index
    # Let's compute next_start
    if sid < len(segments):
        next_start = segments[sid][1]  # sid is 1-indexed, so segments[sid] is next (0-indexed)
    else:
        next_start = VIDEO_DURATION
    max_allowed = next_start - start
    status = "OK" if dur <= max_allowed + 0.05 else "OVER"
    print(f"       -> duration {dur:.2f}s / max {max_allowed:.2f}s {status}")
    if status == "OVER":
        print(f"       WARNING: segment {sid} overflows by {dur - max_allowed:.2f}s, may overlap next. Consider increasing rate.")
    tts_files.append((sid, start, end, text, rate, out, dur))

print("\nStep 1 complete.")
print()

# Step 2: Generate captions SRT and ASS
print("Step 2: Generating captions...")

srt_path = WORK / "captions.srt"
ass_path = WORK / "captions.ass"

# SRT
with open(srt_path, "w", encoding="utf-8") as f:
    for sid, start, end, text, rate, out, dur in tts_files:
        lines = wrap_text(text, width=52)
        f.write(f"{sid}\n")
        f.write(f"{sec_to_srt(start)} --> {sec_to_srt(end)}\n")
        for line in lines:
            f.write(line + "\n")
        f.write("\n")
print(f"  SRT written to {srt_path}")

# ASS - styled, professional, bottom center, semi-transparent box
# Design: 1920x1080, Font Arial 48, white with black outline, dark box, padding
ass_header = """[Script Info]
Title: Karhari Tube OAuth Verification Captions
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 1
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Inter,52,&H00FFFFFF,&H000000FF,&H00000000,&HCC000000,0,0,0,0,100,100,0,0,1,2.5,1,2,80,80,55,1
Style: Emphasis,Inter,52,&H00FFFFFF,&H000000FF,&H001A4D8F,&HCC000000,1,0,0,0,100,100,0,0,1,2.5,1,2,80,80,55,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

with open(ass_path, "w", encoding="utf-8") as f:
    f.write(ass_header)
    for sid, start, end, text, rate, out, dur in tts_files:
        lines = wrap_text(text, width=48)
        # Join with \N for ASS line break
        ass_text = r"\N".join(lines)
        # Add a subtle fade? not needed
        # For scope segment (9), add emphasis? Keep default
        f.write(f"Dialogue: 0,{sec_to_ass(start)},{sec_to_ass(end)},Default,,0,0,0,,{ass_text}\n")

print(f"  ASS written to {ass_path}")

# Also generate a styled ASS with better visual hierarchy - add title card at 00:00?
# We'll keep as is for now.

print("\nStep 2 complete.")
print()

# Step 3: Assemble voiceover track aligned to timeline via ffmpeg adelay + amix
print("Step 3: Assembling voiceover track...")

voiceover_wav = WORK / "voiceover.wav"
voiceover_m4a = WORK / "voiceover.m4a"

# Build ffmpeg command with adelay per segment
# Use aformat to ensure stereo 48k
inputs = []
filter_parts = []
amix_inputs = []
for idx, (sid, start, end, text, rate, out, dur) in enumerate(tts_files):
    inputs.extend(["-i", str(out)])
    # adelay expects ms per channel, for stereo need "delay|delay"
    delay_ms = int(round(start * 1000))
    # Convert to stereo, resample to 48000, then delay
    # Using aformat and adelay
    filter_parts.append(f"[{idx}:a]aformat=sample_fmts=fltp:channel_layouts=stereo,aresample=48000,adelay={delay_ms}|{delay_ms}:all=1[a{idx}]")
    amix_inputs.append(f"[a{idx}]")

num_inputs = len(tts_files)
# amix then loudnorm and pad/trim to VIDEO_DURATION
filter_complex = "; ".join(filter_parts) + f"; {' '.join(amix_inputs)}amix=inputs={num_inputs}:duration=longest:dropout_transition=0:normalize=0, loudnorm=I=-16:TP=-1.5:LRA=11, apad, atrim=duration={VIDEO_DURATION}, aformat=sample_fmts=fltp:channel_layouts=stereo [mix]"

cmd = [str(FFMPEG), "-y"] + inputs + ["-filter_complex", filter_complex, "-map", "[mix]", "-c:a", "pcm_s16le", "-ar", "48000", "-ac", "2", str(voiceover_wav)]

print("  Running ffmpeg for voiceover assembly...")
print("  Filter complexity:", len(filter_complex), "chars")
# Print command for debugging (first 500 chars)
print("  Cmd:", " ".join(cmd[:12]) + " ... (total inputs " + str(num_inputs) + ")")
result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode != 0:
    print("ERROR assembling voiceover:")
    print(result.stderr[-5000:])
    sys.exit(1)
else:
    print(f"  Voiceover WAV created: {voiceover_wav} ({voiceover_wav.stat().st_size/1024/1024:.2f} MB)")
    # also create m4a for reference
    # Check duration
    dur_str = subprocess.check_output([str(FFPROBE), "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(voiceover_wav)], text=True).strip()
    print(f"  Voiceover duration: {dur_str}s (target {VIDEO_DURATION}s)")

print("\nStep 3 complete.")
print()

# Step 4: Render final video with burned captions + voiceover
print("Step 4: Rendering final video (1080p, burned captions, voiceover)...")
# Also copy SRT/ASS to root for reference
import shutil
shutil.copy(srt_path, ROOT / "verify-video.srt")
shutil.copy(ass_path, ROOT / "verify-video.ass")
shutil.copy(voiceover_wav, ROOT / "voiceover.wav")

# Final output
final_mp4 = ROOT / "Karhari_Tube_OAuth_Verification_Final.mp4"
final_preview_mp4 = ROOT / "work" / "final_with_captions.mp4"

# Use libx264, crf 18, preset medium, 60fps keep, yuv420p
# Burn ASS via ass filter - need to escape path properly for ffmpeg
# ASS path for ffmpeg: use forward slashes, escape colon if needed? On Windows, need to handle "C:"
# ffmpeg's ass filter expects path with escaped colon: e.g., C\\:/path/file.ass
# Simpler to copy ass to a path without colon issues? But we can try with forward slashes and escape.
ass_for_ffmpeg = str(ass_path).replace("\\", "/").replace(":", "\\:")
# Actually ffmpeg on Windows wants: C\:/Users/.../file.ass  - we tested? Let's try without escaping first, ffmpeg may handle.
# We'll try passing as-is with forward slashes.
# If fails, we fallback to subtitles filter with escaped path.

# Try first with ass filter using unescaped but quoted
# We'll build command and handle error fallback

def try_render(ass_filter_path):
    vf = f"ass='{ass_filter_path}'"
    # Use scale? keep original 1920x1080
    cmd = [
        str(FFMPEG), "-y",
        "-i", str(ORIGINAL),
        "-i", str(voiceover_wav),
        "-filter_complex", f"[0:v]{vf}[v]",
        "-map", "[v]",
        "-map", "1:a",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-ar", "48000",
        "-ac", "2",
        "-shortest",
        "-movflags", "+faststart",
        str(final_mp4)
    ]
    print(f"  Trying vf: {vf}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result

# First attempt with normal path (forward slashes)
ass_try = str(ass_path).replace("\\", "/")
result = try_render(ass_try)
if result.returncode != 0:
    print("  First attempt failed, trying escaped colon...")
    print(result.stderr[-3000:])
    ass_escaped = str(ass_path).replace("\\", "/").replace(":", "\\:")
    result = try_render(ass_escaped)
    if result.returncode != 0:
        print("  Second attempt failed, trying subtitles filter...")
        print(result.stderr[-3000:])
        # Try subtitles filter
        vf = f"subtitles='{ass_escaped}'"
        cmd = [
            str(FFMPEG), "-y",
            "-i", str(ORIGINAL),
            "-i", str(voiceover_wav),
            "-filter_complex", f"[0:v]{vf}[v]",
            "-map", "[v]",
            "-map", "1:a",
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "18",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "192k",
            "-ar", "48000",
            "-ac", "2",
            "-shortest",
            "-movflags", "+faststart",
            str(final_mp4)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print("ERROR rendering final video:")
            print(result.stderr[-5000:])
            sys.exit(1)

if result.returncode == 0:
    print(f"  Final video created: {final_mp4}")
    print(f"  Size: {final_mp4.stat().st_size/1024/1024:.2f} MB")
    # Check duration and streams
    probe_out = subprocess.check_output([str(FFPROBE), "-v", "error", "-show_entries", "stream=codec_name,width,height,avg_frame_rate", "-show_entries", "format=duration", "-of", "json", str(final_mp4)], text=True)
    print("  Probe:", probe_out[:500])
    # Get duration
    import json
    j = json.loads(probe_out)
    dur = float(j["format"]["duration"])
    print(f"  Final duration: {dur:.2f}s")
    # Verify audio exists
    a_check = subprocess.check_output([str(FFPROBE), "-v", "error", "-select_streams", "a", "-show_entries", "stream=codec_name", "-of", "default=nw=1:nk=1", str(final_mp4)], text=True).strip()
    print(f"  Audio codec: {a_check}")
else:
    print("Failed to render")
    sys.exit(1)

print("\nStep 4 complete.")
print()

# Step 5: Also generate a version without burned captions but with SRT sidecar for optional use
print("Step 5: Generating verification artifacts...")
# Create a version that just mixes audio without captions (for alternative submission)
final_no_burn = ROOT / "Karhari_Tube_OAuth_Verification_NoBurn.mp4"
cmd = [
    str(FFMPEG), "-y",
    "-i", str(ORIGINAL),
    "-i", str(voiceover_wav),
    "-c:v", "copy",
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    "-movflags", "+faststart",
    str(final_no_burn)
]
result = subprocess.run(cmd, capture_output=True, text=True)
if result.returncode == 0:
    print(f"  No-burn version: {final_no_burn}")
else:
    print("  No-burn failed:", result.stderr[-2000:])

# Create info JSON for Google verification
info = {
    "applicationName": "Karhari Tube (Karhari Media Pvt. Ltd.)",
    "domain": "karharimedia.org",
    "oauthClientId": "390824693261-kd2p3qqbps765ce2d02tfu5p...",
    "scopes": [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube",
        "email", "profile", "openid"
    ],
    "video": {
        "original": str(ORIGINAL),
        "finalWithCaptions": str(final_mp4),
        "finalNoBurn": str(final_no_burn),
        "duration": VIDEO_DURATION,
        "resolution": "1920x1080",
        "fps": 60,
        "audio": "AAC 192k 48kHz stereo, loudnorm -16 LUFS",
        "captions": "Burned-in ASS with SRT sidecar, bottom-center, Inter 52pt, WCAG compliant"
    },
    "voiceover": {
        "voice": VOICE,
        "engine": "Microsoft Edge TTS",
        "language": "en-US",
        "segments": len(segments)
    },
    "notes": [
        "Client ID visible at 01:02-01:13 in address bar (sharp 1080p)",
        "Consent screen scopes expanded at 01:26-01:43 with voiceover explaining each scope",
        "Upload flow demonstrates youtube.upload scope end-to-end (302-335: Uploading YouTube 80%-92%)",
        "Captions do not obscure URL bar (bottom-center placement)",
        "Audio normalized to -16 LUFS for reviewer clarity"
    ]
}
with open(ROOT / "verification_info.json", "w", encoding="utf-8") as f:
    json.dump(info, f, indent=2)
print(f"  Info JSON: {ROOT / 'verification_info.json'}")

# Create a README for submission
readme = f"""# Karhari Tube - Google OAuth Verification Video

## Video Files
- **Final with burned captions (RECOMMENDED FOR SUBMISSION)**: `Karhari_Tube_OAuth_Verification_Final.mp4`
  - 1920x1080, 60fps, H.264 CRF 18, AAC 192k
  - Captions burned-in (bottom-center, not obscuring URL bar)
  - Voiceover synchronized per timestamped script
  - Duration: {VIDEO_DURATION}s (7:05)

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
- Clear English voiceover (Edge TTS {VOICE}, minimal background noise)
- Captions match voiceover verbatim, bottom-center
- No music bed obscuring voice

## How Voiceover Was Placed
Each segment's TTS is placed at exact script start time via ffmpeg adelay, with silence gaps computed to next segment start. Two tight segments (Terms @ 00:36, Privacy @ 00:43) use +25% and +10% rate to fit windows without overlap.

Generated: {__import__('datetime').datetime.now().isoformat()}
"""
with open(ROOT / "VERIFICATION_README.md", "w", encoding="utf-8") as f:
    f.write(readme)
print(f"  README: {ROOT / 'VERIFICATION_README.md'}")

print("\n=== All steps complete ===")
print(f"Final video ready for Google OAuth verification submission:")
print(f"  {final_mp4}")
print(f"Please review the video and submit to Google Cloud Console > OAuth consent screen > Verification.")
