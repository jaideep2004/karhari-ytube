"use client";
import { useState } from "react";

type Health = {
  at: string;
  r2: { ok: boolean; configured: boolean; checks: { label: string; ok: boolean; value?: string; hint?: string }[]; live?: { ok: boolean; label: string; value?: string; hint?: string; error?: string } };
  google: { ok: boolean; checks: { label: string; ok: boolean; value?: string; hint?: string }[] };
  facebook: { ok: boolean; checks: { label: string; ok: boolean; value?: string; hint?: string }[] };
  core: { ok: boolean; checks: { label: string; ok: boolean; value?: string; hint?: string }[] };
};

function StatusBadge({ ok, configured }: { ok: boolean; configured?: boolean }) {
  if (configured === false) return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">Not configured</span>;
  return ok ? <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">● Connected</span> : <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">● Not connected</span>;
}

export function AdminHealth({ initial }: { initial: Health }) {
  const [health, setHealth] = useState<Health>(initial);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, string>>({});

  const verify = async (which: "r2" | "google" | "facebook") => {
    setVerifying(which);
    setMsg((m) => ({ ...m, [which]: "" }));
    try {
      const r = await fetch("/api/admin/health", { cache: "no-store" });
      const d = (await r.json()) as Health;
      if (!r.ok) throw new Error((d as unknown as { error?: string }).error || `HTTP ${r.status}`);
      setHealth(d);
      const target = which === "r2" ? d.r2 : which === "google" ? d.google : d.facebook;
      if (target.ok) setMsg((m) => ({ ...m, [which]: which === "r2" ? (d.r2.live?.ok ? "Verified — bucket reachable" : "Credentials set but live check failed") : "Verified — credentials configured" }));
      else setMsg((m) => ({ ...m, [which]: d.r2.live?.error?.slice(0, 120) || "Not connected — check env" }));
    } catch (e) {
      setMsg((m) => ({ ...m, [which]: e instanceof Error ? e.message : String(e) }));
    } finally {
      setVerifying(null);
    }
  };

  const r2Bucket = health.r2.checks.find((c) => c.label === "R2_BUCKET_NAME")?.value;
  const r2LiveOk = health.r2.live?.ok;

  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Integrations</h2>
          <p className="text-xs text-zinc-500">R2, Google and Facebook connection status. Use Verify to run a live check.</p>
        </div>
        <span className="text-xs text-zinc-400">Updated {new Date(health.at).toLocaleTimeString()}</span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* R2 */}
        <div className="rounded-xl border bg-zinc-50 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm">⧉</span>
              <span className="text-sm font-semibold">R2 Storage</span>
            </div>
            <StatusBadge ok={!!r2LiveOk} configured={health.r2.configured} />
          </div>
          <p className="mt-2 text-xs text-zinc-500">{health.r2.configured ? (r2Bucket && r2Bucket !== "not set" ? `Bucket ${r2Bucket}` : "Configured") : "No bucket configured — uploads use local /uploads"}</p>
          {health.r2.live && !health.r2.live.ok && health.r2.configured && (
            <p className="mt-2 text-xs text-red-600">{health.r2.live.value?.slice(0, 120)}</p>
          )}
          <button onClick={() => verify("r2")} disabled={verifying === "r2"} className="mt-3 w-full rounded-full border bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50">
            {verifying === "r2" ? "Verifying…" : "Verify connection"}
          </button>
          {msg.r2 && <p className={`mt-2 text-xs ${msg.r2.includes("Verified") ? "text-green-700" : "text-red-600"}`}>{msg.r2}</p>}
        </div>

        {/* Google */}
        <div className="rounded-xl border bg-zinc-50 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm">▶</span>
              <span className="text-sm font-semibold">Google / YouTube</span>
            </div>
            <StatusBadge ok={health.google.ok} />
          </div>
          <p className="mt-2 text-xs text-zinc-500">{health.google.ok ? "OAuth credentials configured" : "Missing GOOGLE_CLIENT_ID / SECRET"}</p>
          <button onClick={() => verify("google")} disabled={verifying === "google"} className="mt-3 w-full rounded-full border bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50">
            {verifying === "google" ? "Verifying…" : "Verify connection"}
          </button>
          {msg.google && <p className={`mt-2 text-xs ${msg.google.includes("Verified") ? "text-green-700" : "text-red-600"}`}>{msg.google}</p>}
        </div>

        {/* Facebook */}
        <div className="rounded-xl border bg-zinc-50 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm">f</span>
              <span className="text-sm font-semibold">Facebook</span>
            </div>
            <StatusBadge ok={health.facebook.ok} />
          </div>
          <p className="mt-2 text-xs text-zinc-500">{health.facebook.ok ? "OAuth credentials configured" : "Missing FACEBOOK_CLIENT_ID / SECRET"}</p>
          <button onClick={() => verify("facebook")} disabled={verifying === "facebook"} className="mt-3 w-full rounded-full border bg-white px-3 py-2 text-xs font-medium hover:bg-zinc-50 disabled:opacity-50">
            {verifying === "facebook" ? "Verifying…" : "Verify connection"}
          </button>
          {msg.facebook && <p className={`mt-2 text-xs ${msg.facebook.includes("Verified") ? "text-green-700" : "text-red-600"}`}>{msg.facebook}</p>}
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-zinc-400">Credentials are never shown. Verify runs a live check without exposing secrets.</p>
    </div>
  );
}
