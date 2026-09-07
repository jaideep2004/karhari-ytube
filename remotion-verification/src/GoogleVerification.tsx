import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";

const DOMAIN = "https://karhariyt.karharimedia.org";
const BRAND = "Karhari Tube";
const COMPANY = "Karhari Media";

// Voiceover script per docs/GOOGLE_VERIFICATION_VIDEO.md - demo uses captions; TTS will use same text
const SCENES = [
  {
    id: "intro",
    dur: 90, // 3s
    title: "Karhari Tube by Karhari Media",
    sub: DOMAIN,
    caption:
      "This is Karhari Tube by Karhari Media — a tool that turns any audio file and cover image into a 1080p video and uploads it to your own YouTube channel.",
  },
  {
    id: "consent",
    dur: 180, // 6s
    title: "Sign in with Google — Consent Screen",
    sub: "Scopes: youtube.upload · youtube.readonly · youtube · email · profile",
    caption:
      "We request these scopes to list your channels and upload the video you created. This is user-initiated only.",
  },
  {
    id: "readonly",
    dur: 150, // 5s
    title: "youtube.readonly — List your channels",
    sub: "GET youtube/v3/channels?mine=true",
    caption:
      "Read-only access lists your own YouTube channels so you can choose the upload destination.",
  },
  {
    id: "upload",
    dur: 210, // 7s
    title: "youtube.upload — Create & Upload 1080p video",
    sub: "ffmpeg → 1920x1080 showwaves → resumable upload",
    caption:
      "We generate a 1080p video with ffmpeg and upload it to the channel you selected when you click Create & Upload.",
  },
  {
    id: "privacy",
    dur: 150, // 5s
    title: "Privacy & Limited Use",
    sub: `${DOMAIN}/privacy · ${DOMAIN}/terms`,
    caption:
      "We only use YouTube data to generate and upload the video you requested. We don't share, sell, or train AI on this data. See our Privacy Policy.",
  },
  {
    id: "outro",
    dur: 90, // 3s
    title: "Revoke anytime",
    sub: "myaccount.google.com/permissions · Dashboard → Disconnect Google",
    caption:
      "You can revoke access anytime from your Google Account or from Dashboard. Contact: privacy@karharimedia.com",
  },
];

function UrlBar({ url }: { url: string }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 22,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 999,
        padding: "6px 14px",
        fontSize: 13,
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#111827",
        display: "flex",
        alignItems: "center",
        gap: 8,
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 999, background: "#10b981" }} />
      {url}
    </div>
  );
}

function SceneCard({
  scene,
  index,
}: {
  scene: (typeof SCENES)[number];
  index: number;
}) {
  const frame = useCurrentFrame();
  // fps reserved for timing: const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 12], [12, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "#f8f9fa",
        fontFamily: "Outfit, DM Sans, system-ui, sans-serif",
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
      }}
    >
      <UrlBar url={DOMAIN} />
      {/* Progress thin bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 4,
          background: "#1d4686",
          width: `${((index + 1) / SCENES.length) * 100}%`,
        }}
      />
      <div
        style={{
          width: 1140,
          maxWidth: "92%",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 36,
          boxShadow: "0 12px 40px rgba(0,0,0,0.06)",
          opacity,
          transform: `translateY(${y}px)`,
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: 2, color: "#6b7280", textTransform: "uppercase" }}>
          Karhari Tube · Verification Demo · Scene {index + 1}/{SCENES.length}
        </div>
        <div style={{ fontSize: 38, fontWeight: 700, color: "#111827", marginTop: 8, lineHeight: 1.1 }}>
          {scene.title}
        </div>
        <div style={{ fontSize: 14, color: "#1d4686", marginTop: 6, fontWeight: 600 }}>{scene.sub}</div>

        {/* Mock browser card */}
        <div
          style={{
            marginTop: 18,
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            overflow: "hidden",
            background: "#f9fafb",
          }}
        >
          <div style={{ height: 28, background: "#ffffff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 6, padding: "0 10px" }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#ef4444" }} />
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#f59e0b" }} />
            <span style={{ width: 10, height: 10, borderRadius: 999, background: "#10b981" }} />
            <span style={{ marginLeft: 12, fontSize: 11, color: "#6b7280" }}>{DOMAIN}{scene.id === "privacy" ? "/privacy" : scene.id === "consent" ? "/api/auth/callback/google" : ""}</span>
          </div>
          <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
            {scene.id === "consent" ? (
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, width: 520, textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Choose an account</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>to continue to Karhari Tube</div>
                <div style={{ marginTop: 10, background: "#f3f4f6", borderRadius: 8, padding: 10, fontSize: 11, lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 700 }}>Google will share with Karhari Tube:</div>
                  <div>• See, edit, create your YouTube videos (youtube.upload)</div>
                  <div>• See your YouTube channels (youtube.readonly)</div>
                  <div>• See your email & profile</div>
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 11, color: "#6b7280", padding: "6px 10px" }}>Cancel</span>
                  <span style={{ fontSize: 11, color: "#fff", background: "#1d4686", padding: "6px 12px", borderRadius: 999 }}>Allow</span>
                </div>
              </div>
            ) : scene.id === "readonly" ? (
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, width: 260 }}>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>YouTube — Select channel</div>
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ background: "#1d4686", color: "#fff", borderRadius: 8, padding: "8px 10px", fontSize: 12 }}>✓ Karhari Media — @karharimedia</div>
                    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 10px", fontSize: 12 }}>My Channel — @jaideep</div>
                  </div>
                </div>
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, width: 220 }}>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>API</div>
                  <div style={{ fontSize: 11, marginTop: 6, fontFamily: "monospace" }}>youtube/v3/channels?mine=true</div>
                  <div style={{ fontSize: 11, color: "#059669", marginTop: 6 }}>200 OK · 2 channels</div>
                </div>
              </div>
            ) : scene.id === "upload" ? (
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 320, height: 180, background: "#0a0a16", borderRadius: 10, position: "relative", overflow: "hidden", border: "1px solid #1f2937" }}>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 60, display: "flex", alignItems: "flex-end", gap: 2, padding: 6 }}>
                    {Array.from({ length: 32 }).map((_, i) => (
                      <div key={i} style={{ flex: 1, background: "#00E5FF", height: 8 + (i % 5) * 8, borderRadius: 2, opacity: 0.9 }} />
                    ))}
                  </div>
                  <div style={{ position: "absolute", top: 14, left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>song new1 (1) — test</div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>YouTube Studio → Content</div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>✅ Uploaded: youtube.com/watch?v=...</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Visibility: Public · 1080p</div>
                </div>
              </div>
            ) : scene.id === "privacy" ? (
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, width: 560, textAlign: "left" }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{BRAND} Privacy Policy</div>
                <div style={{ fontSize: 11, color: "#374151", marginTop: 6, lineHeight: 1.5 }}>
                  We use YouTube API Services per Google API Services User Data Policy. Limited Use: YouTube data is used only to generate and upload the
                  video you requested. We do not share or sell data. Contact: privacy@karharimedia.com
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "#374151" }}>{scene.caption}</div>
            )}
          </div>
        </div>

        {/* Caption bar */}
        <div
          style={{
            marginTop: 16,
            background: "#111827",
            color: "#fff",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          <span style={{ opacity: 0.7, marginRight: 8 }}>🎙</span>
          {scene.caption}
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
          Brand: {COMPANY} · Product: {BRAND} · Domain: {DOMAIN} · Scopes shown on screen
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const GoogleVerificationDemo: React.FC = () => {
  // fps reserved for timing: const { fps } = useVideoConfig();
  let cursor = 0;
  return (
    <AbsoluteFill style={{ background: "#f8f9fa" }}>
      {SCENES.map((s, i) => {
        const from = cursor;
        cursor += s.dur;
        return (
          <Sequence key={s.id} from={from} durationInFrames={s.dur}>
            <SceneCard scene={s} index={i} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const GOOGLE_VERIFICATION_FPS = 30;
export const GOOGLE_VERIFICATION_DURATION = SCENES.reduce((a, s) => a + s.dur, 0); // 870 frames = 29s demo (short demo; extend to 6600 for 3:40 by repeating pacing)
