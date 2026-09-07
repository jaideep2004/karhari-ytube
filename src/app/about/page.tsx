import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  Target,
  Users,
  Music2,
  Video,
  Zap,
  ShieldCheck,
  Globe2,
  Heart,
  Lightbulb,
  Rocket,
  Award,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Karhari Media builds simple tools for creators. Karhari Tube turns any MP3, WAV or FLAC into a YouTube or Facebook video in seconds — no editing needed.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Karhari Tube",
    description:
      "Karhari Media tools for creators. Turn audio + cover into 1080p video for YouTube and Facebook.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <div className="w-full bg-[#f8f9fa] text-[#212529]">
      {/* Hero */}
      <div className="mx-auto max-w-[1140px] px-4 py-10 sm:px-6 md:py-14 xl:px-12">
        <div className="flex justify-center">
          <Link href="/">
            <img
              src="/images/karhari-media-b1.png"
              alt="Karhari Media"
              className="h-auto max-h-[110px] w-auto max-w-[340px] object-contain"
            />
          </Link>
        </div>

        <div className="mx-auto mt-10 max-w-[760px] text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#6b7280]">
            About Karhari Media
          </p>
          <h1
            className="mt-3 text-[32px] font-light leading-none sm:text-[42px] md:text-[48px]"
            style={{ letterSpacing: "-0.04em" }}
          >
            Tools that help creators
            <span className="block font-normal">get heard.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[640px] text-[16px] leading-7 text-zinc-600 sm:text-[17px]">
            Karhari Media is an independent studio from India building fast,
            single-purpose tools for musicians, podcasters and labels. Our most
            loved product — <span className="font-medium text-[#212529]">Karhari Tube</span> — turns
            any audio file into a video for YouTube and Facebook in seconds.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-full bg-[#212529] px-6 py-2.5 text-sm font-medium text-white hover:bg-black"
            >
              <Rocket className="mr-2 h-4 w-4" /> Try Karhari Tube
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-6 py-2.5 text-sm font-medium text-[#212529] hover:bg-zinc-50"
            >
              Contact us
            </Link>
          </div>
        </div>
      </div>

      {/* Dark stats band — matches homepage #212529 */}
      <section className="border-y border-neutral-700/30 bg-[#212529] py-10 text-white">
        <div className="mx-auto max-w-[1140px] px-4 sm:px-6 xl:px-12">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { k: "2011", v: "Founded", sub: "Roots in music distribution" },
              { k: "1.5M+", v: "Creators", sub: "Trusted worldwide" },
              { k: "40M+", v: "Uploads", sub: "Audio → video generated" },
              { k: "10 sec", v: "Avg. render", sub: "1080p ffmpeg pipeline" },
            ].map((s) => (
              <div key={s.k} className="text-center">
                <div className="text-[30px] font-light leading-none sm:text-[36px]" style={{ letterSpacing: "-0.04em" }}>{s.k}</div>
                <div className="mt-1 text-sm font-medium text-white">{s.v}</div>
                <div className="text-xs text-neutral-400">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story + What we do */}
      <div className="mx-auto max-w-[1140px] px-4 py-12 sm:px-6 md:py-16 xl:px-12">
        <div className="grid gap-10 md:grid-cols-2 md:gap-12">
          {/* Story */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-600 shadow-sm ring-1 ring-zinc-200">
              <Sparkles className="h-3.5 w-3.5" /> Our story
            </div>
            <h2 className="mt-4 text-[26px] font-light leading-tight" style={{ letterSpacing: "-0.03em" }}>
              From distribution to a focused, single-purpose uploader.
            </h2>
            <div className="mt-4 space-y-3 text-[14.5px] leading-7 text-zinc-600">
              <p>
                Karhari Media started as a full-stack music distribution service — ISRCs, stores, royalties, reports.
                Over time, one request kept coming back from artists:{" "}
                <em className="text-[#212529]">“Can you just turn my MP3 into a YouTube video quickly?”</em>
              </p>
              <p>
                We listened. <strong className="font-medium text-[#212529]">Karhari Tube</strong> is the answer — we
                stripped everything else away and rebuilt the one job creators actually needed: upload an audio file,
                add a cover image, pick a visualizer, and publish to YouTube or Facebook. No timelines, no watermark,
                no transcoding loss.
              </p>
              <p>
                It is inspired by the clarity of TunesToTube, but rebuilt for 2026 — modern OAuth, parallel dual
                uploads, R2 caching, and a 720px centered workflow that does one thing well.
              </p>
            </div>
          </div>

          {/* What we do card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold">
              <Video className="h-4 w-4" /> What Karhari Media builds
            </h3>
            <div className="mt-5 grid gap-4">
              {[
                {
                  icon: Music2,
                  title: "Karhari Tube — Audio → Video",
                  desc: "MP3 / WAV / FLAC + thumbnail → 1080p video (bars or circular) → YouTube / Facebook. Generate once, deliver to both platforms in parallel.",
                },
                {
                  icon: Zap,
                  title: "Fast ffmpeg pipeline",
                  desc: "libx264 fast / crf22, AAC 192k, 25fps showwaves or 360-bar canvas ring. Average render 8–15s for a 3-min track.",
                },
                {
                  icon: ShieldCheck,
                  title: "You own everything",
                  desc: "We never claim ownership. Audio stays untranscoded. Revoke YouTube/Facebook access anytime from your Google/Meta account.",
                },
              ].map((f) => (
                <div key={f.title} className="flex gap-3 rounded-xl bg-[#f8f9fa] p-4">
                  <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#212529]" />
                  <div>
                    <div className="text-[13.5px] font-semibold leading-5">{f.title}</div>
                    <div className="mt-1 text-[13px] leading-6 text-zinc-600">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-2 text-xs text-zinc-500">
              <span className="rounded-full bg-[#f8f9fa] px-2.5 py-1 ring-1 ring-zinc-200">Next.js 15</span>
              <span className="rounded-full bg-[#f8f9fa] px-2.5 py-1 ring-1 ring-zinc-200">ffmpeg + R2</span>
              <span className="rounded-full bg-[#f8f9fa] px-2.5 py-1 ring-1 ring-zinc-200">Auth.js v5</span>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mt-14">
          <h3 className="text-center text-[22px] font-light" style={{ letterSpacing: "-0.03em" }}>
            What we believe
          </h3>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Target,
                title: "Simple beats bloated",
                desc: "One screen, one job. No learning curve, no timeline editor — just audio + image → video.",
              },
              {
                icon: Heart,
                title: "Creator-first",
                desc: "No watermark by default, no quality loss from transcoding, no hidden fees. Your content stays yours.",
              },
              {
                icon: Lightbulb,
                title: "Honest & private",
                desc: "Clear pricing, clear data use. OAuth tokens are AES-256-GCM encrypted. Ads only on public pages.",
              },
              {
                icon: Users,
                title: "Support by the makers",
                desc: "Support is direct from the team that builds the product — not a bot, not a queue.",
              },
              {
                icon: Globe2,
                title: "Built for scale",
                desc: "R2 caching, signed URLs, resumable YouTube chunks — so a 3-min or 60-min upload just works.",
              },
              {
                icon: Award,
                title: "Craft matters",
                desc: "Pixel-perfect 1080p, drawtext title/artist, optional logo watermark, canvas visualizers at 25fps.",
              },
            ].map((v) => (
              <div key={v.title} className="rounded-2xl border border-zinc-200 bg-white p-5">
                <v.icon className="h-5 w-5 text-[#212529]" />
                <div className="mt-3 text-[14.5px] font-semibold">{v.title}</div>
                <div className="mt-1 text-[13.5px] leading-6 text-zinc-600">{v.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 rounded-2xl bg-[#212529] px-6 py-8 text-center text-white sm:px-10 sm:py-10">
          <h3 className="text-[22px] font-light sm:text-[26px]" style={{ letterSpacing: "-0.03em" }}>
            Ready to turn your audio into video?
          </h3>
          <p className="mx-auto mt-2 max-w-[560px] text-sm leading-6 text-neutral-300">
            Drop a track, add a cover, pick bars or circular — Karhari Tube handles the rest and publishes to YouTube or Facebook for you.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center rounded-full bg-white px-7 py-2.5 text-sm font-medium text-[#212529] hover:bg-zinc-100"
          >
            Start uploading — it&apos;s free
          </Link>
          <div className="mt-3 text-xs text-neutral-400">
            No credit card required • Works with Google & Facebook
          </div>
        </div>
      </div>
    </div>
  );
}
