"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";

type Channel = { id: string; title: string; thumbnailUrl: string };
type Page = { id: string; name: string; picture: string };

export function UploadCard() {
  const { data: session, status } = useSession();
  const authed = status === "authenticated";

  // file state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioMeta, setAudioMeta] = useState<{ r2Key?: string; r2Url?: string; duration?: number; fileSize?: number } | null>(null);
  const [audioUploading, setAudioUploading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [artworkMeta, setArtworkMeta] = useState<{ r2Key?: string; r2Url?: string } | null>(null);
  const [artworkUploading, setArtworkUploading] = useState(false);
  const [artworkError, setArtworkError] = useState<string | null>(null);
  const [generateFromTitle, setGenerateFromTitle] = useState(false);

  const [title, setTitle] = useState("");
  const [preset, setPreset] = useState<"bars" | "circular" | "wave" | "pulse">("bars");
  const [color, setColor] = useState("cyan");

  const [channels, setChannels] = useState<Channel[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [wantYoutube, setWantYoutube] = useState(true);
  const [wantFacebook, setWantFacebook] = useState(false);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const [pagesError, setPagesError] = useState<string | null>(null);

  const [visibility, setVisibility] = useState<"public" | "unlisted" | "private">("public");
  const [scheduleAt, setScheduleAt] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const audioInputRef = useRef<HTMLInputElement>(null);
  const artworkInputRef = useRef<HTMLInputElement>(null);

  // fetch channels/pages when authed - with error + refresh handling
  const fetchChannels = async () => {
    setChannelsLoading(true);
    setChannelsError(null);
    try {
      const r = await fetch("/api/auth/youtube/channels");
      const text = await r.text();
      let d: any = null;
      try { d = text ? JSON.parse(text) : {}; } catch { throw new Error(text ? text.slice(0,300) : `YouTube ${r.status}: empty response — please Retry (DB waking up)`); }
      if (!r.ok) throw new Error(d.error || `YouTube ${r.status}: ${String(text).slice(0,200)}`);
      if (d.channels) {
        setChannels(d.channels);
        if (d.channels[0]) setSelectedChannel((prev) => prev || d.channels[0].id);
        if (!d.channels.length) setChannelsError("No YouTube channels found - check that your Google account has a YouTube channel");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // hide raw JSON parse noise
      const friendly = msg.includes("Unexpected end of JSON") || msg.includes("Unexpected token") ? "Server temporarily unavailable — please hit Retry in a few seconds" : msg;
      setChannelsError(friendly);
      setChannels([]);
    } finally {
      setChannelsLoading(false);
    }
  };
  const fetchPages = async () => {
    setPagesLoading(true);
    setPagesError(null);
    try {
      const r = await fetch("/api/auth/facebook/pages");
      const text = await r.text();
      let d: any = null;
      try { d = text ? JSON.parse(text) : {}; } catch { throw new Error(text ? text.slice(0,300) : `Facebook ${r.status}: empty response — please Retry`); }
      if (!r.ok) throw new Error(d.error || `Facebook ${r.status}: ${String(text).slice(0,200)}`);
      if (d.pages) {
        setPages(d.pages);
        if (d.pages[0]) setSelectedPage((prev) => prev || d.pages[0].id);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const friendly = msg.includes("Unexpected end of JSON") || msg.includes("Unexpected token") ? "Server temporarily unavailable — please hit Retry" : msg;
      setPagesError(friendly);
      setPages([]);
    } finally {
      setPagesLoading(false);
    }
  };
  useEffect(() => {
    if (!authed) return;
    fetchChannels();
    fetchPages();
  }, [authed]);

  const uploadAudio = useCallback(async (file: File) => {
    setAudioError(null);
    setAudioUploading(true);
    setAudioFile(file);
    if (!title && file.name) {
      const base = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ");
      setTitle(base.slice(0, 80));
    }
    try {
      const url = URL.createObjectURL(file);
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.src = url;
      await new Promise<void>((res) => {
        audio.onloadedmetadata = () => res();
        audio.onerror = () => res();
      });
      if (audio.duration && isFinite(audio.duration)) {
        setAudioMeta((m) => ({ ...(m || {}), duration: audio.duration }));
      }
      URL.revokeObjectURL(url);
    } catch {}
    if (!authed) {
      setAudioUploading(false);
      return;
    }
    const fd = new FormData();
    fd.append("audio", file);
    try {
      const res = await fetch("/api/upload/audio", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAudioMeta({ r2Key: data.r2Key, r2Url: data.r2Url, duration: data.duration, fileSize: data.fileSize });
    } catch (e) {
      setAudioError(e instanceof Error ? e.message : String(e));
    } finally {
      setAudioUploading(false);
    }
  }, [authed, title]);

  const uploadArtwork = useCallback(async (file: File) => {
    setArtworkError(null);
    setArtworkUploading(true);
    setArtworkFile(file);
    if (!authed) {
      setArtworkUploading(false);
      return;
    }
    const fd = new FormData();
    fd.append("artwork", file);
    try {
      const res = await fetch("/api/upload/artwork", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setArtworkMeta({ r2Key: data.r2Key, r2Url: data.r2Url });
    } catch (e) {
      setArtworkError(e instanceof Error ? e.message : String(e));
    } finally {
      setArtworkUploading(false);
    }
  }, [authed]);

  const handleAudioDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) uploadAudio(f);
  };
  const handleArtworkDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) uploadArtwork(f);
  };

  // ── Tags helpers (YouTube Studio style) ──────────────────────────────
  const tagsChars = tags.join(",").length;
  const tagsLimitChars = 500;
  const tagsLimitCount = 15;
  const canAddMoreTags = tags.length < tagsLimitCount && tagsChars < tagsLimitChars;
  const addTag = useCallback((raw: string) => {
    const t = raw.trim().replace(/\s+/g, " ").slice(0, 30);
    if (!t) return false;
    let didAdd = false;
    setTags((prev) => {
      if (prev.includes(t)) return prev;
      if (prev.length >= tagsLimitCount) return prev;
      const prevChars = prev.join(",").length;
      const nextChars = prev.length ? prevChars + 1 + t.length : t.length;
      if (nextChars > tagsLimitChars) return prev;
      didAdd = true;
      return [...prev, t];
    });
    // note: state update is async; return heuristic based on checks above
    if (tags.includes(t) || tags.length >= tagsLimitCount) return false;
    const nextCharsHeur = tags.length ? tags.join(",").length + 1 + t.length : t.length;
    if (nextCharsHeur > tagsLimitChars) return false;
    return true;
  }, [tags]);
  const removeTag = (idx: number) => setTags((prev) => prev.filter((_, i) => i !== idx));
  const commitTagInput = useCallback(() => {
    const raw = tagInput.trim();
    if (!raw) return;
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    // build next list in one go to avoid stale closures when adding many at once
    setTags((prev) => {
      let next = [...prev];
      let nextChars = next.join(",").length;
      for (const pRaw of parts) {
        const p = pRaw.replace(/\s+/g, " ").slice(0, 30);
        if (!p || next.includes(p)) continue;
        if (next.length >= tagsLimitCount) break;
        const inc = next.length ? 1 + p.length : p.length;
        if (nextChars + inc > tagsLimitChars) break;
        next.push(p);
        nextChars += inc;
      }
      return next.length === prev.length ? prev : next;
    });
    // clear input if at least one would have been added; keep only if completely rejected as duplicate/limit single
    const wouldAdd = parts.some((p) => {
      const pp = p.replace(/\s+/g, " ").slice(0, 30);
      if (!pp || tags.includes(pp)) return false;
      if (tags.length >= tagsLimitCount) return false;
      const nc = tags.length ? tags.join(",").length + 1 + pp.length : pp.length;
      return nc <= tagsLimitChars;
    });
    if (wouldAdd || parts.length > 1) setTagInput("");
  }, [tagInput, tags]);

  const canSubmit = !!audioFile && !!title.trim() && !audioUploading && !artworkUploading;
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobPhase, setJobPhase] = useState<string | null>(null);
  const [jobPct, setJobPct] = useState<number>(0);
  const [jobError, setJobError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!jobId) return;
    const tick = async () => {
      try {
        const r = await fetch(`/api/jobs/${jobId}`);
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "poll failed");
        const j = d.job;
        setJobPhase(j.status === "done" ? "done" : j.progress?.phase || j.status);
        setJobPct(j.progress?.pct ?? 0);
        if (j.status === "done" || j.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          if (j.status === "failed") setJobError(j.error || "Failed");
        }
      } catch {}
    };
    tick();
    pollRef.current = setInterval(tick, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [jobId]);

  const handleCreate = async () => {
    if (!authed) return;
    if (!canSubmit) {
      alert("Please add audio and title");
      return;
    }
    if (!audioMeta?.r2Key) {
      alert("Audio still uploading - please wait for ok");
      return;
    }
    if (wantYoutube && !selectedChannel && channels.length) {
      alert("Please pick a YouTube channel or uncheck YouTube");
      return;
    }
    if (wantFacebook && !selectedPage && pages.length) {
      alert("Please pick a Facebook Page or uncheck Facebook");
      return;
    }
    setCreating(true);
    setJobError(null);
    try {
      const destinations: { platform: string; channelId?: string; pageId?: string }[] = [];
      if (wantYoutube && selectedChannel) destinations.push({ platform: "youtube", channelId: selectedChannel });
      if (wantFacebook && selectedPage) destinations.push({ platform: "facebook", pageId: selectedPage });

      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioR2Key: audioMeta.r2Key,
          artworkR2Key: artworkMeta?.r2Key || null,
          title: title.trim(),
          artist: "",
          preset,
          color,
          visibility,
          scheduleAt: scheduleAt || null,
          description,
          tags: tags.length ? tags : null,
          destinations,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create job");
      setJobId(data.jobId);
      setJobPhase("queued");
      setJobPct(5);
    } catch (e) {
      setJobError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  // Visualizer preview canvas - uses ref-based animation to avoid Maximum update depth exceeded
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const vizRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => {
      canvas.width = 120;
      canvas.height = 68;
    };
    resize();
    window.addEventListener("resize", resize);

    const colorMap: Record<string, string> = {
      cyan: "#00E5FF",
      green: "#00FF88",
      pink: "#FF3366",
      purple: "#AA44FF",
      red: "#FF4444",
      white: "#FFFFFF",
    };
    const hex = colorMap[color] || colorMap.cyan;

    const draw = () => {
      vizRef.current = (vizRef.current + 1) % 360;
      const t = vizRef.current;
      ctx.clearRect(0, 0, 120, 68);
      ctx.fillStyle = hex;
      ctx.strokeStyle = hex;

      if (preset === "bars") {
        const barCount = 8;
        const barWidth = 120 / barCount - 1;
        for (let i = 0; i < barCount; i++) {
          const height = Math.sin((i / barCount) * Math.PI * 2 + t / 10) * 14 + 18;
          ctx.fillRect(i * (barWidth + 1), 68 - height, barWidth, height);
        }
      } else if (preset === "circular") {
        const cx = 60, cy = 34, r = 22;
        ctx.beginPath();
        for (let i = 0; i < 24; i++) {
          const ang = (i / 24) * Math.PI * 2 + t / 60;
          const h = Math.sin(i * 0.9 + t / 8) * 6 + 8;
          const x1 = cx + Math.cos(ang) * r;
          const y1 = cy + Math.sin(ang) * r;
          const x2 = cx + Math.cos(ang) * (r + h);
          const y2 = cy + Math.sin(ang) * (r + h);
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, r - 4, 0, Math.PI * 2);
        ctx.strokeStyle = hex + "33";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (preset === "wave") {
        ctx.beginPath();
        ctx.lineWidth = 1.8;
        for (let x = 0; x < 120; x++) {
          const y = 34 + Math.sin(x * 0.12 + t / 6) * 14 + Math.sin(x * 0.05 + t / 10) * 6;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        // faint fill
        ctx.lineTo(120, 68);
        ctx.lineTo(0, 68);
        ctx.closePath();
        ctx.fillStyle = hex + "18";
        ctx.fill();
      } else if (preset === "pulse") {
        const cx = 60, cy = 34;

        // Central glowing core — smooth pulsing radius
        const corePulse = Math.sin(t / 14) * 0.5 + 0.5; // 0..1
        const coreR = 8 + corePulse * 4;

        // Outer halo — counter-phase to core, soft glow
        const haloPulse = Math.sin(t / 18 + Math.PI) * 0.5 + 0.5;
        const haloR = coreR + 8 + haloPulse * 6;

        // Glow trail
        const grad = ctx.createRadialGradient(cx, cy, coreR * 0.5, cx, cy, haloR);
        grad.addColorStop(0, hex);
        grad.addColorStop(0.4, hex + "55");
        grad.addColorStop(1, hex + "00");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
        ctx.fill();

        // Solid core
        ctx.fillStyle = hex;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
        ctx.fill();

        // Equalizer-style 8 bars radiating outward, each independently animated
        // Looks like audio react + ring, much more dynamic
        const barCount = 8;
        for (let i = 0; i < barCount; i++) {
          const ang = (i / barCount) * Math.PI * 2 + t / 90;
          // Each bar has its own beat — combination of slow LFO + fast wobble
          const barPulse =
            (Math.sin(i * 1.3 + t / 8) * 0.5 + 0.5) * 0.6 +
            (Math.sin(i * 2.7 + t / 4) * 0.5 + 0.5) * 0.4; // 0..1
          const barLen = 6 + barPulse * 14;
          const x1 = cx + Math.cos(ang) * (coreR + 4);
          const y1 = cy + Math.sin(ang) * (coreR + 4);
          const x2 = cx + Math.cos(ang) * (coreR + 4 + barLen);
          const y2 = cy + Math.sin(ang) * (coreR + 4 + barLen);

          ctx.strokeStyle = hex;
          ctx.globalAlpha = 0.55 + barPulse * 0.45;
          ctx.lineWidth = 1.6 + barPulse * 1.4;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // 3 orbiting particles, opposite direction, with trail
        for (let i = 0; i < 3; i++) {
          const baseAng = -(t / 22) + (i * Math.PI * 2) / 3;
          const orbitR = haloR + 4;
          for (let k = 6; k >= 0; k--) {
            const trailT = k / 6;
            const a = baseAng - trailT * 0.18;
            const x = cx + Math.cos(a) * orbitR;
            const y = cy + Math.sin(a) * orbitR;
            ctx.globalAlpha = (1 - trailT) * 0.85;
            ctx.fillStyle = hex;
            ctx.beginPath();
            ctx.arc(x, y, 1.2 + (1 - trailT) * 0.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [color, preset]);

  return (
    <section className="mx-auto mt-8 max-w-[720px] rounded-2xl border bg-white p-6 shadow-sm md:p-8">
      <div className="space-y-6">
        {/* Audio */}
        <div>
          <div className="text-sm font-medium">① Audio</div>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleAudioDrop}
            onClick={() => audioInputRef.current?.click()}
            className={`mt-2 flex cursor-pointer items-center justify-between rounded-lg border border-dashed px-4 py-6 text-sm ${audioFile ? "bg-zinc-50 border-zinc-300" : "bg-zinc-50 hover:bg-zinc-100"}`}
          >
            <span className="truncate">
              {audioFile ? (
                <>
                  {audioFile.name} {audioMeta?.duration ? `• ${Math.floor(audioMeta.duration / 60)}:${String(Math.floor(audioMeta.duration % 60)).padStart(2, "0")}` : ""} • {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                </>
              ) : (
                <>
                  Drop MP3 / WAV / FLAC here or <span className="font-medium text-zinc-600 underline">Browse</span>
                </>
              )}
            </span>
            <span className="ml-2 shrink-0 text-xs text-zinc-500">
              {audioUploading ? "Uploading…" : audioFile ? (audioMeta?.r2Key ? "Uploaded ok" : authed ? "Queued" : "Selected (sign in to upload)") : "≤200 MB"}
            </span>
          </div>
          <input
            ref={audioInputRef}
            type="file"
            accept=".mp3,.wav,.flac,.aac,.m4a,audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAudio(f);
            }}
          />
          {audioFile && (
            <button onClick={() => { setAudioFile(null); setAudioMeta(null); setAudioError(null); }} className="mt-1 text-xs text-zinc-500 hover:text-black">Remove audio</button>
          )}
          {audioError && <div className="mt-1 text-xs text-red-600">{audioError}</div>}
        </div>

        {/* Artwork */}
        <div>
          <div className="text-sm font-medium">② Thumbnail</div>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleArtworkDrop}
            onClick={() => artworkInputRef.current?.click()}
            className={`mt-2 flex cursor-pointer items-center justify-between rounded-lg border border-dashed px-4 py-6 text-sm ${artworkFile ? "bg-zinc-50 border-zinc-300" : "bg-zinc-50 hover:bg-zinc-100"}`}
          >
            <span className="truncate">
              {artworkFile ? (
                <>
                  {artworkFile.name} • {(artworkFile.size / 1024 / 1024).toFixed(2)} MB {artworkMeta?.r2Url ? "(R2 ok)" : ""}
                </>
              ) : (
                <>
                  Drop JPG / PNG / WEBP or <span className="font-medium text-zinc-600 underline">Browse</span>
                </>
              )}
            </span>
            <span className="ml-2 shrink-0 text-xs text-zinc-500">{artworkUploading ? "Uploading…" : artworkFile ? "Selected ok" : "≤15 MB"}</span>
          </div>
          <input
            ref={artworkInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadArtwork(f);
            }}
          />
          <label className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
            <input type="checkbox" checked={generateFromTitle} onChange={(e) => setGenerateFromTitle(e.target.checked)} className="h-4 w-4" /> Generate from title (gradient fallback)
          </label>
          {artworkError && <div className="mt-1 text-xs text-red-600">{artworkError}</div>}
          <div className="mt-1 text-[11px] text-zinc-500">For best results, use a <span className="font-medium">landscape image (1920x1080 or wider)</span> - it fills the full video background. Portrait images will be cropped.</div>
          {artworkFile && (
            <div className="mt-2 text-xs text-zinc-500">{artworkMeta?.r2Url ? "R2 ok " + artworkMeta.r2Key : artworkMeta?.r2Key ? "Stored locally - R2 unavailable (check dashboard)" : "Queued locally"}</div>
          )}
          {artworkFile && artworkMeta?.r2Url && (
            <img src={artworkMeta.r2Url} alt="artwork preview" className="mt-2 h-24 w-24 rounded object-cover" />
          )}
        </div>

        {/* ── Video details: Title + Description + Tags (YT Studio grouping for SEO) ── */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold">③ Video details</div>
            <span className="text-[11px] text-zinc-500">Title + description + tags — like YouTube Studio · helps search & SEO</span>
          </div>

          {/* Title — with counter like YT Studio */}
          <div className="mt-3">
            <label className="flex items-center justify-between text-sm font-medium">
              <span>Title *</span>
              <span className={`text-[11px] font-normal ${title.length > 100 ? "text-red-600" : "text-zinc-500"}`}>{title.length}/100</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              placeholder="My Song — e.g. Karhari Tube | Lofi Chill Mix 2026"
              maxLength={100}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200"
            />
            <div className="mt-1 text-[11px] text-zinc-500">Used as YouTube/Facebook video title. Clear titles rank better — add artist or mood once.</div>
          </div>

          {/* Description */}
          <div className="mt-4">
            <label className="flex items-center justify-between text-sm font-medium">
              <span>Description</span>
              <span className="text-[11px] font-normal text-zinc-500">{description.length}/5000</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
              rows={4}
              maxLength={5000}
              placeholder="Add description for YouTube/Facebook — story, credits, links, hashtags…&#10;Example: Produced by Karhari Media. Follow for more lofi & Hindi covers."
              className="mt-1 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200"
            />
            <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
              <span>First 2 lines show in search & above the fold.</span>
              <span>{description.length ? `${Math.max(0, 5000 - description.length)} left` : ""}</span>
            </div>
          </div>

          {/* Tags — YouTube Studio style chips */}
          <div className="mt-4">
            <label className="flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-1.5">Tags <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold tracking-widest text-zinc-500 ring-1 ring-zinc-200">SEO</span></span>
              <span className={`text-[11px] font-normal ${tagsChars > tagsLimitChars || tags.length > tagsLimitCount ? "text-red-600" : "text-zinc-500"}`}>
                {tags.length}/{tagsLimitCount} · {tagsChars}/{tagsLimitChars} chars
              </span>
            </label>

            {/* chip list + input in one bordered box */}
            <div
              className={`mt-1 flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-lg border bg-white px-2 py-2 text-sm focus-within:border-zinc-400 focus-within:ring-1 focus-within:ring-zinc-200 ${!canAddMoreTags && tagInput ? "border-amber-300 bg-amber-50/40" : "border-zinc-300"}`}
              onClick={() => document.getElementById("kt-tag-input")?.focus()}
            >
              {tags.map((t, i) => (
                <span key={`${t}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-[#212529] px-2.5 py-1 text-xs font-medium text-white">
                  {t}
                  <button
                    type="button"
                    aria-label={`Remove ${t}`}
                    onClick={() => removeTag(i)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-white/20"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </span>
              ))}
              <input
                id="kt-tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
                    e.preventDefault();
                    commitTagInput();
                  } else if (e.key === "Backspace" && !tagInput && tags.length) {
                    e.preventDefault();
                    removeTag(tags.length - 1);
                  }
                }}
                onBlur={() => { if (tagInput.trim()) commitTagInput(); }}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  if (pasted.includes(",")) {
                    e.preventDefault();
                    const parts = pasted.split(",").map((s) => s.trim()).filter(Boolean);
                    let added = 0;
                    for (const p of parts) if (addTag(p)) added++;
                    if (!added && parts.length) setTagInput(pasted);
                  }
                }}
                placeholder={tags.length === 0 ? "Add tags — e.g. lofi, Hindi song, Karhari Media (press Enter or ,)" : canAddMoreTags ? "Add another tag…" : "Limit reached"}
                disabled={!canAddMoreTags && !tagInput}
                maxLength={30}
                className="min-w-[160px] flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-zinc-400 disabled:opacity-60"
              />
            </div>

            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] leading-4">
              <span className="text-zinc-500">
                Like in <span className="font-medium text-zinc-700">YouTube Studio → Tags</span>: helps search & recommendations. Press <span className="rounded bg-white px-1 py-0.5 font-medium ring-1 ring-zinc-200">Enter</span> or <span className="rounded bg-white px-1 py-0.5 font-medium ring-1 ring-zinc-200">,</span> to add. Each ≤30 chars.
              </span>
              {tags.length > 0 && (
                <button type="button" onClick={() => setTags([])} className="shrink-0 text-zinc-500 underline hover:text-black">Clear all</button>
              )}
            </div>

            {!canAddMoreTags && (
              <div className="mt-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] leading-4 text-amber-900">
                YouTube allows up to <strong>15 tags / 500 chars</strong>. Remove a tag to add another.
              </div>
            )}

            {tags.length === 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-[11px] text-zinc-500">Try:</span>
                {["lofi", "Hindi cover", "Karhari Media", "chill mix", "audio to video"].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => addTag(sug)}
                    className="rounded-full border border-dashed border-zinc-300 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Visualizer */}
        <div>
          <div className="text-sm font-medium">④ Visualizer</div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            {(["bars", "circular", "wave", "pulse"] as const).map((p) => (
              <label
                key={p}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${preset === p ? "border-[#212529] bg-[#212529] text-white" : "border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50"}`}
              >
                <input type="radio" name="preset" checked={preset === p} onChange={() => setPreset(p)} className="sr-only" />
                {p === "bars" ? "Bars" : p === "circular" ? "Circular" : p === "wave" ? "Wave" : "Pulse"}
              </label>
            ))}
            <select value={color} onChange={(e) => setColor(e.target.value)} className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs">
              <option value="cyan">Cyan</option>
              <option value="green">Green</option>
              <option value="pink">Pink</option>
              <option value="purple">Purple</option>
              <option value="red">Red</option>
              <option value="white">White</option>
            </select>
            <canvas ref={canvasRef} className="h-[68px] w-[120px] shrink-0 rounded-lg border border-zinc-200 bg-[#0a0a16]" />
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">
            {preset === "bars" && "Classic NCS bars at bottom"}
            {preset === "circular" && "360-bar ring around artwork (canvas)"}
            {preset === "wave" && "Smooth line waveform"}
            {preset === "pulse" && "Equalizer ring + glowing core + orbiting trails"}
          </div>
        </div>

        {/* Destinations */}
        <div>
          <div className="text-sm font-medium">⑤ Upload to</div>
          <div className="mt-2 space-y-3 rounded-lg border p-4">
            <label className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={wantYoutube}
                  onChange={(e) => setWantYoutube(e.target.checked)}
                  className="h-4 w-4"
                /> YouTube
              </span>
              {authed ? (
                <div className="flex flex-col items-end gap-1">
                  <select
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="rounded border px-2 py-1 text-xs"
                    disabled={channelsLoading}
                  >
                    {channels.length === 0 ? (
                      <option>{channelsLoading ? "Loading…" : channelsError ? "No channels - see error" : "No channels"}</option>
                    ) : (
                      channels.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)
                    )
                  }</select>
                  {channelsError && <span className="text-[11px] text-red-600 max-w-[220px] text-right">{channelsError}</span>}
                  {channelsError && (
                    <span className="flex gap-1">
                      <button onClick={() => fetchChannels()} className="text-[11px] underline text-zinc-600">Retry</button>
                      <span className="text-[11px] text-zinc-400">·</span>
                      <button onClick={() => signIn("google", { callbackUrl: "/" })} className="text-[11px] underline text-zinc-600">Reconnect Google</button>
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-zinc-500">Sign in with Google to list</span>
              )}
            </label>
            <label className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={wantFacebook}
                  onChange={(e) => setWantFacebook(e.target.checked)}
                  className="h-4 w-4"
                /> Facebook
              </span>
              {authed ? (
                <div className="flex flex-col items-end gap-1">
                  <select
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(e.target.value)}
                    className="rounded border px-2 py-1 text-xs"
                    disabled={pagesLoading}
                  >
                    {pages.length === 0 ? (
                      <option>{pagesLoading ? "Loading…" : "No pages"}</option>
                    ) : (
                      pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)
                    )}
                  </select>
                  {pagesError && <span className="mt-1 block text-[11px] text-red-600 max-w-[220px] text-right">{pagesError}</span>}
                  {pagesError && (
                    <span className="flex gap-1 justify-end">
                      <button onClick={() => fetchPages()} className="text-[11px] underline text-zinc-600">Retry</button>
                      <span className="text-[11px] text-zinc-400">·</span>
                      <button onClick={() => signIn("facebook", { callbackUrl: "/" })} className="text-[11px] underline text-zinc-600">Reconnect Facebook</button>
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-zinc-500">Sign in with Facebook to list</span>
              )}
            </label>
            {authed && !channels.length && !pagesLoading && (
              <div className="text-xs text-zinc-500">
                Connect the other provider in <Link href="/dashboard/settings/connections" className="underline">Settings → Connections</Link> to enable dual upload.
              </div>
            )}
            <div className="text-[11px] text-zinc-500">Tip: uncheck both YouTube and Facebook to generate video only — you can upload later from <Link href="/dashboard/jobs" className="underline">Jobs → Open → Upload to YouTube/Facebook</Link>.</div>
          </div>
        </div>

        {/* Visibility & Schedule — kept separate but close to video details for publishing */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as typeof visibility)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Schedule (optional)</label>
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        </div>

        {!authed ? (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full rounded-full bg-black py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue with Google
            </button>
            <button
              onClick={() => signIn("facebook", { callbackUrl: "/" })}
              className="w-full rounded-full bg-[#1877F2] py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue with Facebook
            </button>
            <div className="text-center text-xs text-zinc-500">Sign in to upload and publish. Files selected will be kept.</div>
          </div>
        ) : jobId ? (
          <div className="rounded-xl border bg-zinc-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium capitalize">
                {jobPhase === "done" ? "Done ok" : jobPhase === "failed" ? "Failed" : jobPhase || "queued"}
              </span>
              <span className="text-xs text-zinc-600">{jobPct}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200">
              <div className="h-full bg-zinc-800 transition-all" style={{ width: `${Math.min(100, Math.max(0, jobPct))}%` }} />
            </div>
            <div className="mt-2 text-xs text-zinc-600 break-all">Job {jobId}</div>
            {jobError && <div className="mt-2 text-xs text-red-600">{jobError}</div>}
            {jobPhase === "done" && (
              <div className="mt-2 text-xs text-green-700">
                Video generated and cached. Connect YouTube/Facebook in Settings to auto-publish, or download from job page.
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <Link href="/dashboard/jobs" className="text-xs font-medium underline">View all jobs →</Link>
              <Link href={`/dashboard/jobs/${jobId}`} className="text-xs font-medium underline">Open job</Link>
              <button
                onClick={() => {
                  setJobId(null);
                  setJobPhase(null);
                  setJobPct(0);
                }}
                className="ml-auto text-xs text-zinc-500 underline"
              >
                Start another
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={handleCreate}
              disabled={!canSubmit || creating}
              className="w-full rounded-full bg-black py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? "Creating job…" : "Create Video (P3) → Jobs"}
            </button>
            {jobError && <div className="mt-2 text-center text-xs text-red-600">{jobError}</div>}
          </>
        )}

        <div className="text-center text-xs text-zinc-500">
          Audio R2: {audioMeta?.r2Key || "not uploaded"} • Artwork R2: {artworkMeta?.r2Key || "none"} {jobId ? `• Active ${jobPct}%` : "• P3 ready"}
        </div>
      </div>
    </section>
  );
}