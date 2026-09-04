"use client";
import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";

type Channel = { id: string; title: string };
type Page = { id: string; name: string };

export function JobDeliver({ jobId, jobStatus, onDelivered }: { jobId: string; jobStatus: string; onDelivered?: () => void }) {
  const { data: session } = useSession();
  const authed = !!session?.user?.email;
  const [channels, setChannels] = useState<Channel[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [channelsError, setChannelsError] = useState<string | null>(null);
  const [pagesError, setPagesError] = useState<string | null>(null);

  const [selectedChannel, setSelectedChannel] = useState("");
  const [selectedPage, setSelectedPage] = useState("");
  const [delivering, setDelivering] = useState<"youtube" | "facebook" | null>(null);
  const [deliverError, setDeliverError] = useState<string | null>(null);
  const [deliverSuccess, setDeliverSuccess] = useState<string | null>(null);

  const fetchChannels = async () => {
    setChannelsLoading(true); setChannelsError(null);
    try { const r = await fetch("/api/auth/youtube/channels"); const d = await r.json(); if (!r.ok) throw new Error(d.error || `YouTube ${r.status}`); if (d.channels) { setChannels(d.channels); if (d.channels[0] && !selectedChannel) setSelectedChannel(d.channels[0].id); } } catch (e) { setChannelsError(e instanceof Error ? e.message : String(e)); } finally { setChannelsLoading(false); }
  };
  const fetchPages = async () => {
    setPagesLoading(true); setPagesError(null);
    try { const r = await fetch("/api/auth/facebook/pages"); const d = await r.json(); if (!r.ok) throw new Error(d.error || `Facebook ${r.status}`); if (d.pages) { setPages(d.pages); if (d.pages[0] && !selectedPage) setSelectedPage(d.pages[0].id); } } catch (e) { setPagesError(e instanceof Error ? e.message : String(e)); } finally { setPagesLoading(false); }
  };

  useEffect(() => { if (authed && jobStatus === "done") { fetchChannels(); fetchPages(); } }, [authed, jobStatus]);

  const deliver = async (platform: "youtube" | "facebook") => {
    setDeliverError(null); setDeliverSuccess(null); setDelivering(platform);
    try {
      const body: Record<string, string> = { platform };
      if (platform === "youtube" && selectedChannel) body.channelId = selectedChannel;
      if (platform === "facebook") { if (!selectedPage) throw new Error("Pick a Facebook Page first"); body.pageId = selectedPage; }
      const r = await fetch(`/api/jobs/${jobId}/deliver`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `Deliver failed ${r.status}`);
      setDeliverSuccess(`${platform === "youtube" ? "YouTube" : "Facebook"} delivered: ${d.videoUrl || d.videoId}`);
      onDelivered?.();
      // reload after 1s to show new destination
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) { setDeliverError(e instanceof Error ? e.message : String(e)); } finally { setDelivering(null); }
  };

  if (jobStatus !== "done") return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Video not ready yet — wait for status <b>done</b> (currently {jobStatus}) before uploading.</div>
  );

  return (
    <div className="mt-4 rounded-xl border bg-zinc-50 p-4">
      <div className="text-sm font-semibold">Upload this video to YouTube / Facebook</div>
      <p className="mt-1 text-xs text-zinc-600">Video already generated — pick a channel/page and upload without re-generating. Re-uploads are blocked if already delivered (delete destination to retry).</p>

      {!authed && <div className="mt-3 text-xs text-red-600">Sign in to upload — <button onClick={() => signIn(undefined, { callbackUrl: `/dashboard/jobs/${jobId}` })} className="underline">Sign in</button></div>}

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* YouTube */}
        <div className="rounded-lg border bg-white p-3">
          <div className="text-sm font-medium">YouTube</div>
          {channelsError && <div className="mt-1 text-xs text-red-600">{channelsError} <button onClick={fetchChannels} className="underline">Retry</button> · <button onClick={() => signIn("google", { callbackUrl: `/dashboard/jobs/${jobId}` })} className="underline">Reconnect Google</button></div>}
          <select value={selectedChannel} onChange={(e) => setSelectedChannel(e.target.value)} disabled={channelsLoading} className="mt-2 w-full rounded border px-2 py-1.5 text-xs">
            {channels.length === 0 ? <option>{channelsLoading ? "Loading channels…" : "No channels"}</option> : channels.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <button onClick={() => deliver("youtube")} disabled={!!delivering || !authed} className={`mt-2 w-full rounded-full px-4 py-2 text-xs font-medium ${delivering === "youtube" ? "bg-zinc-300" : "bg-black text-white hover:bg-zinc-800"} disabled:opacity-50`}>
            {delivering === "youtube" ? "Uploading to YouTube…" : "Upload to YouTube"}
          </button>
          <div className="mt-1 text-[11px] text-zinc-500">Uses current Google connection; refreshes token if expired.</div>
        </div>

        {/* Facebook */}
        <div className="rounded-lg border bg-white p-3">
          <div className="text-sm font-medium">Facebook Page</div>
          {pagesError && <div className="mt-1 text-xs text-red-600">{pagesError} <button onClick={fetchPages} className="underline">Retry</button> · <button onClick={() => signIn("facebook", { callbackUrl: `/dashboard/jobs/${jobId}` })} className="underline">Reconnect Facebook</button></div>}
          <select value={selectedPage} onChange={(e) => setSelectedPage(e.target.value)} disabled={pagesLoading} className="mt-2 w-full rounded border px-2 py-1.5 text-xs">
            {pages.length === 0 ? <option>{pagesLoading ? "Loading pages…" : "No pages"}</option> : pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => deliver("facebook")} disabled={!!delivering || !authed} className={`mt-2 w-full rounded-full px-4 py-2 text-xs font-medium ${delivering === "facebook" ? "bg-zinc-300" : "bg-[#1877F2] text-white hover:bg-[#166fe5]"} disabled:opacity-50`}>
            {delivering === "facebook" ? "Uploading to Facebook…" : "Upload to Facebook"}
          </button>
          <div className="mt-1 text-[11px] text-zinc-500">Requires R2 public URL — if video was stored locally, it will be uploaded to R2 first.</div>
        </div>
      </div>

      {deliverError && <div className="mt-3 rounded bg-red-50 p-3 text-xs text-red-700">{deliverError}</div>}
      {deliverSuccess && <div className="mt-3 rounded bg-green-50 p-3 text-xs text-green-700">{deliverSuccess} — page will reload.</div>}
    </div>
  );
}
