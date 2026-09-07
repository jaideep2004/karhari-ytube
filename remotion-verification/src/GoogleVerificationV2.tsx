import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";

const DOMAIN = "https://karhariyt.karharimedia.org";

// Cursor path per scene: {from:[x,y], to:[x,y], clickAt: frame}
function Cursor({
  from,
  to,
  duration,
  clickAt,
}: {
  from: [number, number];
  to: [number, number];
  duration: number;
  clickAt?: number;
}) {
  const frame = useCurrentFrame();
  const progress = Easing.bezier(0.25, 0.1, 0.25, 1)(interpolate(frame, [0, duration], [0, 1], { extrapolateRight: "clamp" }));
  const x = interpolate(progress, [0, 1], [from[0], to[0]]);
  const y = interpolate(progress, [0, 1], [from[1], to[1]]);
  const isClick = clickAt !== undefined && Math.abs(frame - clickAt) < 6;
  const clickScale = isClick ? interpolate(frame, [clickAt! - 2, clickAt!, clickAt! + 6], [1, 0.92, 1]) : 1;
  const ripple = isClick ? interpolate(frame, [clickAt!, clickAt! + 10], [0, 1], { extrapolateRight: "clamp" }) : 0;

  return (
    <>
      {/* ripple */}
      {isClick && (
        <div
          style={{
            position: "absolute",
            left: to[0],
            top: to[1],
            width: 30 + ripple * 20,
            height: 30 + ripple * 20,
            borderRadius: 999,
            border: "2px solid rgba(29,70,134,0.5)",
            transform: "translate(-50%,-50%)",
            opacity: 1 - ripple,
            pointerEvents: "none",
          }}
        />
      )}
      {/* cursor arrow */}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(-2px,-2px) scale(${clickScale})`,
          pointerEvents: "none",
          filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))",
          transition: "transform 60ms linear",
        }}
      >
        <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
          <path d="M1.5 1L1.5 19L6.5 14.5L9.5 21L12.5 20L9.5 13.2L15 13.2L1.5 1Z" fill="#111827" stroke="#fff" strokeWidth="1.2" />
        </svg>
      </div>
    </>
  );
}

function SceneChrome({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", background: "#f9fafb", boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}>
      <div style={{ height: 28, background: "#fff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 6, padding: "0 10px" }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: "#ef4444" }} />
        <span style={{ width: 10, height: 10, borderRadius: 999, background: "#f59e0b" }} />
        <span style={{ width: 10, height: 10, borderRadius: 999, background: "#10b981" }} />
        <span style={{ marginLeft: 12, fontSize: 11, color: "#6b7280", fontFamily: "Inter, sans-serif" }}>{url}</span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: "#9ca3af", background: "#f3f4f6", padding: "2px 6px", borderRadius: 999 }}>🔒 Secure</span>
      </div>
      <div style={{ height: 360, padding: 16, position: "relative", overflow: "hidden" }}>{children}</div>
    </div>
  );
}

// Reuse captions from v1
const SCENES = [
  { id: "intro", dur: 140, url: DOMAIN, title: "Karhari Tube by Karhari Media", sub: DOMAIN },
  { id: "consent", dur: 240, url: `${DOMAIN}/api/auth/callback/google`, title: "Consent — youtube.upload · youtube.readonly", sub: "Pause 3s — reviewer reads scopes" },
  { id: "readonly", dur: 200, url: DOMAIN, title: "youtube.readonly — List channels", sub: "youtube/v3/channels?mine=true" },
  { id: "upload", dur: 280, url: DOMAIN, title: "youtube.upload — Generate & Upload 1080p", sub: "ffmpeg showwaves → resumable upload" },
  { id: "privacy", dur: 200, url: `${DOMAIN}/privacy`, title: "Privacy & Limited Use", sub: "Only to create the video you requested" },
  { id: "outro", dur: 140, url: DOMAIN, title: "Revoke anytime", sub: "myaccount.google.com/permissions" },
];

export const GoogleVerificationV2: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{ background: "#f8f9fa", fontFamily: "Outfit, DM Sans, system-ui, sans-serif" }}>
      <Audio src={staticFile("voiceover.mp3")} />
      {/* top progress */}
      <div style={{ position: "absolute", top: 0, left: 0, height: 4, background: "#1d4686", width: "100%", opacity: 0.15 }} />

      {SCENES.map((s, i) => {
        const from = cursor;
        cursor += s.dur;
        // cursor paths - tailored per scene
        const paths: Record<string, { from: [number, number]; to: [number, number]; clickAt: number }> = {
          intro: { from: [200, 500], to: [960, 260], clickAt: 45 },
          consent: { from: [960, 260], to: [1080, 420], clickAt: 120 },
          readonly: { from: [1080, 420], to: [640, 300], clickAt: 80 },
          upload: { from: [640, 300], to: [760, 340], clickAt: 100 },
          privacy: { from: [760, 340], to: [520, 280], clickAt: 70 },
          outro: { from: [520, 280], to: [960, 540], clickAt: 40 },
        };
        const p = paths[s.id] ?? { from: [400, 400] as [number, number], to: [960, 400] as [number, number], clickAt: 40 };

        return (
          <Sequence key={s.id} from={from} durationInFrames={s.dur}>
            <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 36 }}>
              <div style={{ width: 1140, maxWidth: "92%" }}>
                <div style={{ fontSize: 12, letterSpacing: 2, color: "#6b7280", textTransform: "uppercase" }}>Scene {i + 1}/{SCENES.length} · Demo with cursor</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#111827", marginTop: 4 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: "#1d4686", fontWeight: 600 }}>{s.sub}</div>

                <div style={{ marginTop: 14, position: "relative" }}>
                  <SceneChrome url={s.url}>
                    {/* scene-specific mock UI */}
                    {s.id === "intro" && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>Karhari Tube</div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>Turn audio + cover into YouTube video — 1080p</div>
                        <div style={{ marginTop: 8, background: "#1d4686", color: "#fff", padding: "10px 18px", borderRadius: 999, fontSize: 13, fontWeight: 700 }}>Continue with Google →</div>
                      </div>
                    )}
                    {s.id === "consent" && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, width: 520 }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>Karhari Tube wants to access your Google Account</div>
                          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>Scopes: youtube.upload · youtube.readonly · email · profile</div>
                          <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                            <span style={{ fontSize: 11, padding: "6px 10px", color: "#6b7280" }}>Cancel</span>
                            <span style={{ fontSize: 11, background: "#1d4686", color: "#fff", padding: "7px 14px", borderRadius: 999 }}>Allow</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {s.id === "readonly" && (
                      <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center", height: "100%" }}>
                        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, width: 280 }}>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>Select channel</div>
                          <div style={{ marginTop: 8, background: "#1d4686", color: "#fff", borderRadius: 8, padding: "8px 10px", fontSize: 12 }}>✓ Karhari Media</div>
                        </div>
                      </div>
                    )}
                    {s.id === "upload" && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, height: "100%" }}>
                        <div style={{ width: 340, height: 190, background: "#0a0a16", borderRadius: 10, position: "relative", overflow: "hidden" }}>
                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 56, display: "flex", gap: 2, padding: 6, alignItems: "flex-end" }}>
                            {Array.from({ length: 28 }).map((_, k) => (
                              <div key={k} style={{ flex: 1, background: "#00E5FF", height: 10 + (k % 4) * 10, borderRadius: 2 }} />
                            ))}
                          </div>
                          <div style={{ color: "#fff", textAlign: "center", marginTop: 18, fontSize: 12, fontWeight: 700 }}>song new1 (1)</div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>✅ Uploaded → youtube.com/watch?v=...</div>
                      </div>
                    )}
                    {s.id === "privacy" && (
                      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 14, width: 560, margin: "0 auto" }}>
                        <div style={{ fontSize: 12, fontWeight: 700 }}>Privacy Policy — Limited Use</div>
                        <div style={{ fontSize: 11, color: "#374151", marginTop: 6, lineHeight: 1.5 }}>YouTube data used only to generate the video you requested. Not shared or sold. Contact: privacy@karharimedia.com</div>
                      </div>
                    )}
                    {s.id === "outro" && (
                      <div style={{ textAlign: "center", paddingTop: 60 }}>
                        <div style={{ fontSize: 13, color: "#111827", fontWeight: 700 }}>Revoke anytime</div>
                        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>myaccount.google.com/permissions · Dashboard → Disconnect</div>
                      </div>
                    )}
                  </SceneChrome>
                  {/* cursor overlay per scene */}
                  <Cursor from={p.from} to={p.to} duration={s.dur} clickAt={p.clickAt} />
                </div>

                <div style={{ marginTop: 10, background: "#111827", color: "#fff", borderRadius: 10, padding: "10px 14px", fontSize: 12, lineHeight: 1.4 }}>
                  🎙 {s.title} — real cursor movement, address bar visible at {s.url}
                </div>
              </div>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const GOOGLE_V2_DURATION = 1200;
export const GOOGLE_V2_FPS = 30;
