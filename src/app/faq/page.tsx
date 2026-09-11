export default function FAQPage() {
  const qa = [
    { q: "Need help? How do I contact you?", a: "Email support@karharimedia.com — we respond within 1–2 business days. Include your job ID from /dashboard/jobs for faster help." },
    { q: "Is it free? Is there a watermark?", a: "Video generation is free in this MVP. No watermark is added — output is clean 1080p (1920×1080). The only branding is an optional small logo if present in public/file.svg." },
    { q: "What files can I upload?", a: "Audio: MP3, WAV, FLAC, AAC, M4A up to 200 MB. Thumbnail: JPG, PNG, WEBP up to 15 MB. If you skip thumbnail we render a gradient with your title/artist via ffmpeg drawtext (Hindi font detected automatically)." },
    { q: "Bars vs Circular — what's the difference?", a: "Bars: blurred artwork background + showwaves waveform (s=1920×380, mode=cline, rate=25, color cyan etc.) + centered card + drawtext + logo. Circular: 800×800 canvas ring with 360 radial bars, colorkey overlay on BG, then muxed. Both encode libx264 fast crf22, aac 192k, yuv420p." },
    { q: "Can I upload to both YouTube and Facebook at once?", a: "Yes — connect both providers in Settings → Connections, tick both checkboxes on the card, and we generate once then upload to both in parallel (Promise.allSettled). Each destination gets its own externalId/videoUrl and success/failure status on the job." },
    { q: "YouTube quota — how much?", a: "A YouTube upload costs ~1600 quota units. Default new Google Cloud projects get ~10,000 units/day (~6 uploads/day). Request a quota increase in Google Cloud Console → YouTube Data API v3 → Quotas." },
    { q: "Facebook review — do I need it?", a: "Facebook requires an app in Live mode with pages_show_list, pages_read_engagement, pages_manage_posts. These scopes need App Review + Business verification (1–2 weeks). Until approved, only app admins/testers can publish. R2 must be configured (R2_PUBLIC_DOMAIN) because Facebook pulls via file_url." },
    { q: "Where is my video cached?", a: "Before platform upload we cache to R2 at social-videos/<jobId>.mp4 and keep a local copy in SOCIAL_VIDEO_DIR/<jobId>.mp4. R2 keeps it for re-try; local tmp downloads are removed after 1h (setTimeout fs.rm)." },
    { q: "What about AdSense?", a: "We are AdSense-friendly: ads.txt at /ads.txt, privacy/terms/contact/about pages, lazy adsbygoogle.js via next/script afterInteractive, min-height 280px ad slots to avoid CLS, and ads only on public routes (never on /login, /dashboard, /admin). Fill in your publisher ID in ads.txt before applying." },
  ];
  return (
    <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold">FAQ</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Need help? Contact <a href="mailto:support@karharimedia.com" className="underline font-medium">support@karharimedia.com</a>.
      </p>
      <div className="mt-6 space-y-6">
        {qa.map((item) => (
          <div key={item.q} className="rounded-xl border bg-white p-6">
            <div className="text-sm font-semibold">{item.q}</div>
            <div className="mt-2 text-sm leading-7 text-zinc-600">{item.a}</div>
          </div>
        ))}
      </div>
      <div className="mt-8 rounded-xl border bg-white p-4 text-center text-sm text-zinc-600">
        Still stuck? Email <a href="mailto:support@karharimedia.com" className="font-medium underline">support@karharimedia.com</a> — we respond within 1–2 business days.
      </div>
    </div>
  );
}
