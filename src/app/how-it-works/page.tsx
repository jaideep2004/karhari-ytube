export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold">How it works</h1>
      <ol className="mt-6 space-y-6 text-sm leading-7 text-zinc-700">
        <li><span className="font-semibold text-black">1. Visit &amp; sign in</span> — Continue with Google to enable YouTube or with Facebook to enable Pages. Connect the other provider in Settings → Connections to enable dual upload.</li>
        <li><span className="font-semibold text-black">2. Upload audio + thumbnail</span> — MP3/WAV/FLAC ≤200 MB + JPG/PNG/WEBP ≤15 MB. We upload to R2 (audio/&lt;uuid&gt;), probe duration, and keep a thumbnail preview. No thumbnail? We render a gradient with your title.</li>
        <li><span className="font-semibold text-black">3. Pick visualizer</span> — Bars (blurred BG + showwaves 1920×380) or Circular (800×800 canvas, 360 bars, colorkey). Choose cyan/green/pink/purple/red/white. We show a live preview.</li>
        <li><span className="font-semibold text-black">4. Choose destination &amp; visibility</span> — Tick YouTube and/or Facebook, pick channel/page from the live pickers, set Public/Unlisted/Private and optional schedule, add description.</li>
        <li><span className="font-semibold text-black">5. Generate once, upload everywhere</span> — We create videoJobs doc, download assets from R2 to tmp, run ffmpeg (libx264 fast crf22 aac192k, yuv420p, timeout audioDuration×8000 up to 90 min), cache to R2 at social-videos/&lt;jobId&gt;.mp4, then upload: YouTube via resumable 5 MB chunks; Facebook via R2 file_url. Promise.allSettled — both can succeed/fail independently.</li>
        <li><span className="font-semibold text-black">6. Track progress</span> — Poll GET /api/jobs/[id] shows downloading → generating → uploading → done/failed with per-platform external IDs and video URLs. See all jobs at /dashboard/jobs and per-job at /dashboard/jobs/[id].</li>
      </ol>
      <div className="mt-8 rounded-xl border bg-white p-6 text-sm leading-7 text-zinc-600">
        <div className="font-medium text-black">For admins</div>
        <div>See /admin for visits (analyticsEvents), users, and per-user uploads. Grant admin by setting ADMIN_EMAILS or role=admin in DB. Ads (AdSlot 336×280, min-height 280 to avoid CLS) appear only on public pages (/, /how-it-works, /faq) with lazy afterInteractive loading.</div>
      </div>
    </div>
  );
}
