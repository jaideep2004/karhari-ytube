"use client";
import { useEffect, useState } from "react";
import { JobDeliver } from "./JobDeliver";

type Dest = { platform: string; channelId?: string; pageId?: string; externalId?: string; videoUrl?: string; status: string; error?: string };

type Job = {
  _id: string;
  status: string;
  input: { title: string; artist: string; preset: string; color?: string; audioR2Key: string; artworkR2Key?: string | null; visibility?: string; description?: string | null };
  output?: { r2Url?: string; r2VideoKey?: string; duration?: number; fileSize?: number };
  progress: { phase: string; pct: number };
  error?: string | null;
  createdAt: string;
  destinations?: Dest[];
};

export function JobLive({ jobId, initialJob }: { jobId: string; initialJob: Job }) {
  const [job, setJob] = useState<Job>(initialJob);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (job.status === "done" || job.status === "failed") return;
    const id = setInterval(async () => {
      try {
        const r = await fetch(`/api/jobs/${jobId}`);
        const d = await r.json();
        if (r.ok && d.job) {
          setJob({
            _id: String(d.job._id),
            status: d.job.status,
            input: d.job.input,
            output: d.job.output,
            progress: d.job.progress,
            error: d.job.error,
            createdAt: d.job.createdAt,
            destinations: d.job.destinations,
          });
          setTick((t) => t + 1);
        }
      } catch {}
    }, 2000);
    return () => clearInterval(id);
  }, [jobId, job.status]);

  const isDone = job.status === "done";
  const isFailed = job.status === "failed";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between">
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${isDone ? "bg-green-100 text-green-800" : isFailed ? "bg-red-100 text-red-800" : "bg-zinc-100 text-zinc-700"}`}>{job.status} • {job.progress.phase}</span>
          <span className="text-xs text-zinc-600">{job.progress.pct}%{tick ? ` • live` : ""}</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-200">
          <div className="h-full bg-black transition-all" style={{ width: `${job.progress.pct}%` }} />
        </div>
        {job.error && <div className="mt-3 rounded bg-red-50 p-3 text-xs text-red-700">{job.error}</div>}
        {isDone && job.output?.r2Url && (
          <div className="mt-3">
            <div className="text-xs font-medium">R2 Video (cached)</div>
            <a href={job.output.r2Url} target="_blank" rel="noreferrer" className="break-all text-xs text-blue-600 underline">{job.output.r2Url}</a>
            <div className="mt-1 text-xs text-zinc-500">{job.output.r2VideoKey} • {job.output.duration ? `${Math.floor(job.output.duration)}s` : ""} {job.output.fileSize ? `• ${(job.output.fileSize / 1024 / 1024).toFixed(2)} MB` : ""}</div>
            <video src={job.output.r2Url} controls className="mt-3 max-h-[360px] w-full rounded-lg bg-black" />
          </div>
        )}
        {isDone && !job.output?.r2Url && job.output?.r2VideoKey && (
          <div className="mt-3 text-xs text-zinc-600">Cached: {job.output.r2VideoKey} • Local SOCIAL_VIDEO_DIR/{jobId}.mp4 {job.output.duration ? `• ${job.output.duration}s` : ""} {job.output.fileSize ? `• ${(job.output.fileSize / 1024 / 1024).toFixed(2)} MB` : ""}</div>
        )}
        {job.destinations && job.destinations.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-semibold">Destinations (P4/P5 dual upload)</div>
            <div className="mt-2 space-y-2">
              {job.destinations.map((d, idx) => (
                <div key={idx} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${d.status === "delivered" ? "bg-green-50 border-green-200" : d.status === "failed" ? "bg-red-50 border-red-200" : "bg-zinc-50"}`}>
                  <div>
                    <div className="font-medium capitalize">{d.platform} {d.channelId || d.pageId ? `• ${d.channelId || d.pageId}` : ""}</div>
                    {d.externalId && <div className="text-[11px] text-zinc-600">ID: {d.externalId}</div>}
                    {d.error && <div className="text-[11px] text-red-600">{d.error}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${d.status === "delivered" ? "bg-green-100 text-green-800" : d.status === "failed" ? "bg-red-100 text-red-800" : "bg-zinc-100"}`}>{d.status}</span>
                    {d.videoUrl && <a href={d.videoUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-600 underline">Open →</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {isDone && <JobDeliver jobId={job._id} jobStatus={job.status} onDelivered={() => setTick((t)=>t+1)} />}
      <div className="rounded-xl border bg-white p-4 text-sm">
        <div className="font-medium">{job.input.title} — {job.input.artist || "—"}</div>
        <div className="text-xs text-zinc-600">Preset: {job.input.preset}/{job.input.color} • Visibility: {job.input.visibility || "public"} • Audio: {job.input.audioR2Key} {job.input.artworkR2Key ? `• Art: ${job.input.artworkR2Key}` : "• No artwork (gradient)"}</div>
        {job.input.description && <div className="mt-2 whitespace-pre-wrap text-xs text-zinc-700">Desc: {job.input.description}</div>}
        <div className="mt-2 text-xs text-zinc-500">Created {new Date(job.createdAt).toLocaleString()}</div>
      </div>
    </div>
  );
}
