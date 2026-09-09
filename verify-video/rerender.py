import subprocess, pathlib, sys
ROOT = pathlib.Path(__file__).parent
WORK = ROOT / "work"
ORIGINAL = ROOT / "2026-09-08 12-41-38.mp4"
ASS = WORK / "captions.ass"
VOICE = WORK / "voiceover.wav"
FFMPEG = pathlib.Path(r"C:\Users\jaisi\Documents\GDS Creatives\karhari-tube\node_modules\ffmpeg-static\ffmpeg.exe")
FFPROBE = pathlib.Path(r"C:\Users\jaisi\Documents\GDS Creatives\karhari-tube\node_modules\ffprobe-static\bin\win32\x64\ffprobe.exe")
final = ROOT / "Karhari_Tube_OAuth_Verification_Final.mp4"
final_v2 = ROOT / "Karhari_Tube_OAuth_Verification_Final_v2.mp4"
# remove corrupted
for p in [final, final_v2]:
    if p.exists():
        try:
            p.unlink()
            print(f"removed {p}")
        except: pass

ass_fg = str(ASS).replace("\\", "/").replace(":", "\\:")
print(f"ASS for ffmpeg: {ass_fg}")
# Use same filter as generate.py second attempt (escaped colon)
# Command as in generate.py try_render second attempt
cmd = [
    str(FFMPEG), "-y",
    "-i", str(ORIGINAL),
    "-i", str(VOICE),
    "-filter_complex", f"[0:v]ass='{ass_fg}'[v]",
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
    str(final)
]
print("Running ffmpeg rerender (medium, crf18)...")
print(" ".join(cmd))
result = subprocess.run(cmd, capture_output=True, text=True)
print("STDOUT:", result.stdout[-2000:] if result.stdout else "no stdout")
print("STDERR:", result.stderr[-5000:] if result.stderr else "no stderr")
print("Returncode:", result.returncode)
if result.returncode == 0 and final.exists():
    print(f"SUCCESS: {final} size {final.stat().st_size/1024/1024:.2f} MB")
    # probe
    out = subprocess.check_output([str(FFPROBE), "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(final)], text=True).strip()
    print(f"Duration: {out}")
else:
    print("FAILED")
    sys.exit(1)
