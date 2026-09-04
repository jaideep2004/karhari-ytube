import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions — Karhari Media",
  description:
    "Terms that govern your use of Karhari Media and Karhari Tube — eligibility, content rules, YouTube/Facebook compliance, IP, disclaimers and liability.",
};

const updated = "September 2, 2026";

function TocLink({ n, t }: { n: string; t: string }) {
  return (
    <a href={`#s${n}`} className="block py-1 text-[13px] leading-5 text-zinc-600 hover:text-[#212529] hover:underline">
      <span className="font-medium text-zinc-400">{n}.</span> {t}
    </a>
  );
}

export default function TermsPage() {
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
            Terms & Conditions
          </h1>
          <p className="mt-3 text-sm text-zinc-500">
            Last updated: <span className="font-medium text-[#212529]">{updated}</span> • By using Karhari Tube you agree to these terms. If you do not agree, do not use the service. Contact:{" "}
            <a href="mailto:legal@karharimedia.com" className="underline hover:text-[#212529]">legal@karharimedia.com</a>
          </p>
          <p className="mt-5 rounded-xl border border-zinc-200 bg-white p-4 text-[13.5px] leading-6 text-zinc-600">
            Karhari Media (“we”, “us”, “Karhari Media”) operates <span className="font-medium text-[#212529]">Karhari Tube</span> — a tool that turns your audio + cover image into a 1080p video (bars or circular visualizer) and, at your request, publishes it to the YouTube channel or Facebook Page you select via OAuth. These terms are a legal agreement between you and Karhari Media.
          </p>
        </div>
      </div>

      {/* Body with TOC */}
      <div className="mx-auto max-w-[1140px] px-4 pb-14 sm:px-6 xl:px-12">
        <div className="mx-auto grid max-w-[1140px] gap-8 lg:grid-cols-[220px_1fr] lg:gap-10">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-zinc-200 bg-white p-5">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">On this page</div>
              <nav className="mt-3 space-y-0.5">
                <TocLink n="1" t="Who we are & eligibility" />
                <TocLink n="2" t="Service description" />
                <TocLink n="3" t="Accounts & OAuth" />
                <TocLink n="4" t="Your content & rights" />
                <TocLink n="5" t="Acceptable use" />
                <TocLink n="6" t="Platform compliance" />
                <TocLink n="7" t="IP & feedback" />
                <TocLink n="8" t="Ads, fees & availability" />
                <TocLink n="9" t="Disclaimers" />
                <TocLink n="10" t="Liability" />
                <TocLink n="11" t="Termination" />
                <TocLink n="12" t="General & contact" />
              </nav>
              <div className="mt-5 rounded-xl bg-[#f8f9fa] p-3 text-xs leading-5 text-zinc-600 ring-1 ring-zinc-200">
                Also see <Link href="/privacy" className="font-medium underline">Privacy Policy</Link> for how we handle your data.
              </div>
            </div>
          </aside>

          <article className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
            <div className="prose prose-zinc max-w-none prose-p:text-[14px] prose-p:leading-7 prose-p:text-zinc-600 prose-li:text-[14px] prose-li:leading-7 prose-li:text-zinc-600 prose-headings:font-semibold prose-headings:text-[#212529] prose-a:text-[#212529] prose-a:underline prose-strong:text-[#212529]">
              <h3 id="s1" className="scroll-mt-24 text-[18px]">1. Who we are & eligibility</h3>
              <p>
                Karhari Tube is operated by <strong>Karhari Media</strong> (GDS Creatives), India. You must be at least 13 years old (16 in the EEA/UK) and capable of entering a binding contract. By creating an account or uploading, you represent that you meet these requirements and that all information you provide is accurate.
              </p>

              <h3 id="s2" className="mt-8 scroll-mt-24 text-[18px]">2. What the service does</h3>
              <ul className="list-disc pl-5">
                <li>Generate a 1080p video from your audio + thumbnail using ffmpeg — <em>bars</em> (blurred artwork + audio waveform <code>showwaves mode=cline</code>) or <em>circular</em> (800×800 canvas ring, 360 bars at 25fps).</li>
                <li>At your direction, publish that video to the YouTube channel or Facebook Page you selected, with the title, description, visibility and schedule you set.</li>
                <li>Cache the generated video in R2 at <code>social-videos/&lt;jobId&gt;.mp4</code> for fast re-upload and keep a job record (status, duration, destination results).</li>
              </ul>
              <p>We do not review or endorse your content, guarantee views, monetization, or that any platform will accept your upload.</p>

              <h3 id="s3" className="mt-8 scroll-mt-24 text-[18px]">3. Accounts & OAuth</h3>
              <p>
                You sign in with Google and/or Facebook via Auth.js. You may link both providers under Dashboard → Settings → Connections. You authorize us to store encrypted access/refresh tokens and to act on your behalf only for the scopes you approved (<code>youtube.upload</code>, <code>youtube.readonly</code>, <code>pages_show_list</code>, <code>pages_read_engagement</code>, <code>pages_manage_posts</code> etc.). You can disconnect a provider or revoke access at any time from{" "}
                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">Google Permissions</a> or{" "}
                <a href="https://www.facebook.com/settings?tab=business_tools" target="_blank" rel="noopener noreferrer">Facebook Business Integrations</a>; revocation stops future uploads but does not undo past ones.
              </p>
              <p>You are responsible for keeping your Google/Facebook account secure and for all activity under your Karhari Tube account.</p>

              <h3 id="s4" className="mt-8 scroll-mt-24 text-[18px]">4. Your content — ownership & license</h3>
              <p>
                <strong>You retain ownership</strong> of all audio, images, titles, descriptions and tags you upload. You warrant that you own or control all rights necessary to use this content and to authorize us to process it.
              </p>
              <p>
                By uploading, you grant Karhari Media a limited, non-exclusive, revocable license to transcode, combine, cache, and transmit your content solely to generate your video and deliver it to the platform(s) you selected. We claim no ownership and do not use your content to train models. This license ends when you delete the job/content or your account, subject to platform copies already published and legal retention.
              </p>

              <h3 id="s5" className="mt-8 scroll-mt-24 text-[18px]">5. Acceptable use — you agree not to</h3>
              <ul className="list-disc pl-5">
                <li>Upload content you don’t have rights to, or that is infringing, defamatory, hateful, deceptive, or unlawful — you are solely responsible for clearing samples, artwork and metadata.</li>
                <li>Impersonate any person or brand, mislead about affiliation, or use another person’s channel/Page without permission.</li>
                <li>Abuse quotas, bypass rate limits, scrape, reverse-engineer, or upload malware, or attempt to disrupt the service or ffmpeg pipeline.</li>
                <li>Use the service to spam, artificially inflate views/engagement, or violate YouTube/Facebook spam policies.</li>
              </ul>
              <p>We may remove content, throttle, or suspend accounts that violate these rules, platform policies, or applicable law.</p>

              <h3 id="s6" className="mt-8 scroll-mt-24 text-[18px]">6. Platform compliance</h3>
              <p>
                When you publish to YouTube you must comply with the{" "}
                <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener noreferrer">YouTube Terms of Service</a>,{" "}
                <a href="https://developers.google.com/youtube/terms/api-services-terms-of-service" target="_blank" rel="noopener noreferrer">YouTube API Services Terms</a> and{" "}
                <a href="https://developers.google.com/youtube/terms/developer-policies" target="_blank" rel="noopener noreferrer">Developer Policies</a>; when you publish to Facebook, with{" "}
                <a href="https://www.facebook.com/terms.php" target="_blank" rel="noopener noreferrer">Facebook Terms</a> and{" "}
                <a href="https://developers.facebook.com/terms/" target="_blank" rel="noopener noreferrer">Platform Terms</a>.
                YouTube may process your video under Google’s Privacy Policy; Facebook under Meta’s. We are not responsible for platform-side moderation, demonetization, blocking, or quota enforcement (YouTube default 10,000 units/day; an upload costs ~1,600 units).
              </p>

              <h3 id="s7" className="mt-8 scroll-mt-24 text-[18px]">7. Intellectual property & feedback</h3>
              <p>
                Karhari Media, Karhari Tube, logos and the service’s code, design and visualizers are owned by us or our licensors and are protected by IP laws. You may not copy, modify, or create derivative works except as permitted by law. If you send feedback, you grant us a perpetual, royalty-free license to use it without obligation.
              </p>

              <h3 id="s8" className="mt-8 scroll-mt-24 text-[18px]">8. Ads, fees & availability</h3>
              <p>
                Public pages (homepage, How it works, FAQ, About, Privacy, Terms) may show Google AdSense ads; authenticated pages (login, dashboard, jobs, admin) never do. The free tier has no fees today; paid upgrades, if introduced, will be clearly disclosed before purchase. The service is provided on an “as available” basis — ffmpeg/media processing, R2, or platform APIs may fail, be rate-limited, or change without notice.
              </p>

              <h3 id="s9" className="mt-8 scroll-mt-24 text-[18px]">9. Disclaimers</h3>
              <p>
                To the fullest extent permitted by law, Karhari Media provides the service “as is” and “as available” without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, title, non-infringement, availability, or that uploads will be error-free, timely, or accepted by any platform.
              </p>

              <h3 id="s10" className="mt-8 scroll-mt-24 text-[18px]">10. Limitation of liability</h3>
              <p>
                To the extent permitted by law, Karhari Media’s total aggregate liability for all claims arising from or related to the service is limited to the amount you paid us in the 12 months before the claim (or ₹1,000 if you paid nothing). We are not liable for indirect, incidental, special, consequential, exemplary or punitive damages, or for loss of profits, data, goodwill, or platform-side outcomes, even if advised of the possibility.
              </p>

              <h3 id="s11" className="mt-8 scroll-mt-24 text-[18px]">11. Suspension & termination</h3>
              <p>
                You may stop using the service and delete your account at any time (which also deletes encrypted tokens and, on request, cached videos). We may suspend or terminate your access if you violate these terms, platform policies, or law, or if we discontinue the service. Sections 4, 6, 7, 9, 10 and 12 survive termination.
              </p>

              <h3 id="s12" className="mt-8 scroll-mt-24 text-[18px]">12. General — governing law, changes, contact</h3>
              <p>
                These terms are governed by the laws of India, with courts at the operator’s principal place of business having exclusive jurisdiction, without regard to conflict-of-laws rules. If any provision is found unenforceable, the rest remains in effect. We may update these terms by posting a new version here and updating the “Last updated” date; material changes will be highlighted on the homepage or by email. Continued use after changes means you accept the updated terms.
              </p>
              <p>
                Questions or notices: <a href="mailto:legal@karharimedia.com">legal@karharimedia.com</a> or{" "}
                <Link href="/contact">Contact us</Link>. For privacy, see <Link href="/privacy">Privacy Policy</Link>. For data deletion or account removal, email{" "}
                <a href="mailto:privacy@karharimedia.com">privacy@karharimedia.com</a>.
              </p>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
