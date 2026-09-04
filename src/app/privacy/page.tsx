import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Karhari Media",
  description:
    "How Karhari Media (Karhari Tube) collects, uses and protects your data when you turn audio into video for YouTube and Facebook.",
};

const updated = "September 2, 2026";

function TocLink({ n, t }: { n: string; t: string }) {
  return (
    <a href={`#s${n}`} className="block py-1 text-[13px] leading-5 text-zinc-600 hover:text-[#212529] hover:underline">
      <span className="font-medium text-zinc-400">{n}.</span> {t}
    </a>
  );
}

export default function PrivacyPage() {
  return (
    <div className="w-full bg-[#f8f9fa] text-[#212529]">
      {/* Hero */}
      <div className="mx-auto max-w-[1140px] px-4 py-10 sm:px-6 md:py-12 xl:px-12">
        <div className="mx-auto max-w-[860px]">
          <Link href="/" className="inline-flex items-center text-xs font-medium text-zinc-500 hover:text-[#212529]">
            ← Back to home
          </Link>
          <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Karhari Media • Karhari Tube</p>
          <h1 className="mt-2 text-[30px] font-light leading-none sm:text-[38px]" style={{ letterSpacing: "-0.04em" }}>
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            Last updated: <span className="font-medium text-[#212529]">{updated}</span> • Effective on publish • Contact:{" "}
            <a href="mailto:privacy@karharimedia.com" className="underline hover:text-[#212529]">
              privacy@karharimedia.com
            </a>
          </p>
          <p className="mt-5 rounded-xl border border-zinc-200 bg-white p-4 text-[13.5px] leading-6 text-zinc-600">
            Karhari Media (“we”, “us”) operates <span className="font-medium text-[#212529]">karharimedia.com</span> and{" "}
            <span className="font-medium text-[#212529]">Karhari Tube</span> — a tool that turns your audio + thumbnail
            into a video and publishes it to YouTube or Facebook on your behalf. This policy explains what we collect,
            why we use it, and the choices you have. Short version:{" "}
            <span className="font-medium text-[#212529]">we collect only what we need to generate your video and upload it where you asked</span>.
            We don’t sell your data.
          </p>
        </div>
      </div>

      {/* Body with TOC */}
      <div className="mx-auto max-w-[1140px] px-4 pb-14 sm:px-6 xl:px-12">
        <div className="mx-auto grid max-w-[1140px] gap-8 lg:grid-cols-[220px_1fr] lg:gap-10">
          {/* TOC sticky */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">On this page</div>
              <nav className="mt-3 space-y-0.5">
                <TocLink n="1" t="What we collect" />
                <TocLink n="2" t="How we use it" />
                <TocLink n="3" t="Legal bases (EEA/UK)" />
                <TocLink n="4" t="Cookies & third parties" />
                <TocLink n="5" t="YouTube & Facebook data" />
                <TocLink n="6" t="Retention & deletion" />
                <TocLink n="7" t="Security" />
                <TocLink n="8" t="Your rights" />
                <TocLink n="9" t="Children & transfers" />
                <TocLink n="10" t="Changes & contact" />
              </nav>
              <div className="mt-5 rounded-xl bg-[#f8f9fa] p-3 text-xs leading-5 text-zinc-600 ring-1 ring-zinc-200">
                Questions? <Link href="/contact" className="font-medium underline">Contact us</Link> or see{" "}
                <Link href="/terms" className="underline">Terms</Link>.
              </div>
            </div>
          </aside>

          {/* Article */}
          <article className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
            <div className="prose prose-zinc max-w-none prose-p:text-[14px] prose-p:leading-7 prose-p:text-zinc-600 prose-li:text-[14px] prose-li:leading-7 prose-li:text-zinc-600 prose-headings:font-semibold prose-headings:text-[#212529] prose-a:text-[#212529] prose-a:underline prose-strong:text-[#212529]">
              <h3 id="s1" className="scroll-mt-24 text-[18px]">1. What we collect</h3>
              <ul className="list-disc pl-5">
                <li><strong>Account</strong> — name, email, profile image from Google or Facebook when you sign in (via Auth.js).</li>
                <li><strong>OAuth tokens</strong> — YouTube / Facebook access & refresh tokens so we can upload on your behalf. Stored encrypted (AES-256-GCM, key <code>tube-v1</code>) and never logged.</li>
                <li><strong>Content</strong> — audio files, thumbnails, titles, artist names, descriptions, visualizer choice (bars/circular) and color. Held in R2/S3 under <code>audio/&lt;userId&gt;/…</code>, <code>artwork/…</code>, <code>social-videos/&lt;jobId&gt;.mp4</code>.</li>
                <li><strong>Video jobs</strong> — job status (queued → done/failed), duration, preset, destination results (externalId, videoUrl, error).</li>
                <li><strong>Analytics</strong> — page path, truncated IP, user-agent for aggregate visit counts on <code>/api/analytics/visit</code>. No fingerprinting, no cross-site tracking.</li>
                <li><strong>Support</strong> — messages you send via Contact.</li>
              </ul>

              <h3 id="s2" className="mt-8 scroll-mt-24 text-[18px]">2. How we use it</h3>
              <ul className="list-disc pl-5">
                <li>Generate your 1080p video with ffmpeg (showwaves + circular canvas) and cache it in R2 for fast re-upload.</li>
                <li>Publish to the YouTube channel / Facebook Page <em>you selected</em>, using your tokens and chosen visibility/schedule.</li>
                <li>Run your dashboard (<code>/dashboard</code>, <code>/dashboard/jobs</code>) and admin aggregates (counts of visits/users/uploads per user).</li>
                <li>Serve AdSense ads on public pages only — homepage, How it works, FAQ, About — never on login, dashboard, jobs, or admin.</li>
                <li>Security, abuse prevention, debugging and legal compliance.</li>
              </ul>
              <p>We do not use your audio or thumbnails to train models, and we do not sell personal data.</p>

              <h3 id="s3" className="mt-8 scroll-mt-24 text-[18px]">3. Legal bases (EEA/UK)</h3>
              <p>Where GDPR applies: contract (to provide Karhari Tube), legitimate interests (security, analytics, service improvement), consent (AdSense personalization, optional features), and legal obligation.</p>

              <h3 id="s4" className="mt-8 scroll-mt-24 text-[18px]">4. Cookies & tracking</h3>
              <ul className="list-disc pl-5">
                <li><strong>Essential:</strong> NextAuth session cookie (httpOnly JWT) to keep you signed in.</li>
                <li><strong>Analytics:</strong> first-party visit ping only; no third-party analytics on dashboard.</li>
                <li><strong>Ads:</strong> Google AdSense may set cookies for ad delivery/measurement on public pages. Manage at <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Ads Settings</a> and <a href="https://myadcenter.google.com" target="_blank" rel="noopener noreferrer">My Ad Center</a>. Use of AdSense is subject to <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">Google’s ad policies</a>.</li>
              </ul>

              <h3 id="s5" className="mt-8 scroll-mt-24 text-[18px]">5. YouTube & Facebook data</h3>
              <p>
                If you connect Google, we request <code>youtube.upload</code>, <code>youtube.readonly</code> and{" "}
                <code>youtube</code> to list your channels (<code>youtube/v3/channels?mine=true</code>) and upload via
                resumable uploads. If you connect Facebook, we request <code>pages_show_list</code>,{" "}
                <code>pages_read_engagement</code>, <code>pages_manage_posts</code> to list Pages and publish via Graph API v19.0 <code>file_url</code>.
                Use of these APIs is governed by{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a> +{" "}
                <a href="https://developers.google.com/youtube/terms/api-services-terms-of-service" target="_blank" rel="noopener noreferrer">YouTube API Services Terms</a> and{" "}
                <a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer">Meta Privacy Policy</a>.
                You can revoke at any time:{" "}
                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">Google Permissions</a> and{" "}
                <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank" rel="noopener noreferrer">Facebook Business Integrations</a> — revoking immediately stops future uploads.
              </p>

              <h3 id="s6" className="mt-8 scroll-mt-24 text-[18px]">6. Retention & deletion</h3>
              <ul className="list-disc pl-5">
                <li>Source audio/artwork: removed from temp after processing; R2 copy kept ~24h for retry, then purged.</li>
                <li>Generated video: cached at <code>social-videos/&lt;jobId&gt;.mp4</code> for fast re-upload; deleted on your request or after ~30 days.</li>
                <li>Tokens: deleted when you disconnect the provider in Settings → Connections or delete your account.</li>
                <li>Account deletion: email <a href="mailto:privacy@karharimedia.com">privacy@karharimedia.com</a> — we erase PII within 30 days, keeping only anonymized aggregates (counts) where needed for legal/financial records.</li>
              </ul>

              <h3 id="s7" className="mt-8 scroll-mt-24 text-[18px]">7. Security</h3>
              <p>
                Tokens encrypted with AES-256-GCM; R2 bucket private with signed URLs; HTTPS everywhere; least-privilege
                access; logging redacts secrets. No system is 100% secure — use a strong, unique password for your Google/Facebook account and enable 2-step verification.
              </p>

              <h3 id="s8" className="mt-8 scroll-mt-24 text-[18px]">8. Your rights</h3>
              <p>
                Depending on your region you may have rights to access, correct, delete, export, object to or restrict
                processing, and withdraw consent. To exercise them, email{" "}
                <a href="mailto:privacy@karharimedia.com">privacy@karharimedia.com</a>. You can also export or delete jobs
                from your dashboard. For EEA/UK you may lodge a complaint with your supervisory authority.
              </p>

              <h3 id="s9" className="mt-8 scroll-mt-24 text-[18px]">9. Children & international transfers</h3>
              <p>
                Karhari Tube is not directed to children under 13 (16 in the EEA). We do not knowingly collect data from
                children. Data may be processed in India and in regions where our providers (MongoDB Atlas, Cloudflare R2,
                Vercel/Render) operate, under contracts and safeguards (SCCs where required).
              </p>

              <h3 id="s10" className="mt-8 scroll-mt-24 text-[18px]">10. Changes & contact</h3>
              <p>
                We’ll post updates here and change the “Last updated” date above. Material changes will be highlighted on
                the homepage or by email. Questions: <Link href="/contact">Contact us</Link> or{" "}
                <a href="mailto:privacy@karharimedia.com">privacy@karharimedia.com</a>. Related:{" "}
                <Link href="/terms">Terms & Conditions</Link>.
              </p>
            </div>

            <div className="mt-8 rounded-xl bg-[#f8f9fa] p-4 text-xs leading-5 text-zinc-600 ring-1 ring-zinc-200">
              AdSense disclosure: Google and its partners may use cookies to personalize ads on public pages. You can opt out of personalized ads at{" "}
              <a href="https://adssettings.google.com" className="underline" target="_blank" rel="noopener noreferrer">adssettings.google.com</a>. Karhari Media never shows ads on authenticated pages (login, dashboard, admin).
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
