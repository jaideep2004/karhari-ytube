import Link from "next/link";
import { UploadCard } from "@/components/UploadCard";
import { AuthGate } from "@/components/AuthGate";
import { AdSlot } from "@/components/AdSlot";
import { auth } from "@/auth";
import {
  Zap,
  Award,
  Headset,
  AudioWaveform,
  LayoutDashboard,
  Gauge,
  Puzzle,
  Briefcase,
  ShieldCheck,
  ImageOff,
  ListChecks,
  CalendarDays,
  TrendingUp,
  MegaphoneOff,
  FileAudio,
  CloudUpload,
  CloudDownload,
  AudioLines,
  Save,
  SlidersHorizontal,
  Tags,
  Image as ImageIcon,
  FileImage,
  Link2,
} from "lucide-react";

export default async function Home() {
  const session = await auth();
  const authed = !!session?.user?.email;

  return (
    <div className="w-full bg-[#f8f9fa] text-[#212529]">
      {/* === HEADER AD (TTT: header bg-body-tertiary ad slot 6969748554) === */}
      <div className="w-full bg-[#f8f9fa]">
        <div className="mx-auto max-w-[1140px] px-4 py-2 sm:px-6 xl:px-12">
          <AdSlot slot="6969748554" label="Advertisement — Header" className="mt-0 bg-white" />
        </div>
      </div>
      {/* === TOP HERO / AUTH SECTION === */}
      <div className="mx-auto max-w-[1140px] px-4 py-8 sm:px-6 md:py-12 xl:px-12">
        {/* Karhari Media Logo */}
        <div className="mb-8 flex justify-center md:mb-12">
          <Link href="/">
            <img
              id="karhariLogo"
              src="/images/karhari-media-b1.png"
              alt="Karhari Media Logo"
              className="h-auto max-h-[90px] sm:max-h-[110px] md:max-h-[125px] w-auto max-w-[280px] sm:max-w-[340px] md:max-w-[380px] object-contain"
            />
          </Link>
        </div>

        {/* If authed, show the upload studio card; otherwise show the pre-login 2-column hero */}
        {authed ? (
          <UploadCard />
        ) : (
          <div className="mx-auto my-4 max-w-[960px] py-4">
            <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-12">
              {/* Left Column: "Upload audio to" + YouTube Logo */}
              <div className="flex flex-col justify-center text-left">
                <p
                  className="mb-0 text-[38px] sm:text-[46px] md:text-[54px] font-light leading-none text-[#212529]"
                  style={{ letterSpacing: "-0.15rem" }}
                >
                  Upload audio to
                </p>
                <div className="pt-2">
                  <img
                    id="youtube_logo"
                    src="/images/yt_logo_rgb_light.svg"
                    alt="YouTube logo"
                    className="h-auto w-[240px] sm:w-[280px] md:w-[320px]"
                  />
                </div>
              </div>

              {/* Right Column: Copy text + Google/Facebook sign in buttons */}
              <div className="flex flex-col justify-center text-left">
                <div className="text-[17px] sm:text-[18px] leading-relaxed text-[#212529] space-y-2">
                  <p>Karhari Tube turns your mp3, flac, or wav into a video for YouTube.</p>
                  <p>Drop a track, add an image, and upload audio to YouTube.</p>
                </div>
                <div className="pt-6 sm:pt-8 text-left">
                  <AuthGate />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* === DARK INFO SECTION ("Why use Karhari Tube") === */}
      <section
        id="homepage_info"
        className="border-y border-neutral-700/30 bg-[#212529] py-12 text-white my-6 md:my-10"
        aria-labelledby="homepage-info-title"
      >
        <h2 id="homepage-info-title" className="sr-only">
          Why use Karhari Tube
        </h2>
        <div className="mx-auto max-w-[1140px] px-4 sm:px-6 xl:px-12">
          {/* Row 1 */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-medium text-white">
                <Zap className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-white" aria-hidden="true" />
                Fast Uploads
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-400">
                Upload an MP3 to YouTube in 3 seconds.
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-medium text-white">
                <Award className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-white" aria-hidden="true" />
                Trusted
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-400">
                Operating since 2011, with 40,000,000 uploads from more than 1,500,000 users.
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-medium text-white">
                <Headset className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-white" aria-hidden="true" />
                24/7 Customer Support
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-400">
                Support is provided directly by the software author. Responses are usually immediate.
              </p>
            </div>
          </div>

          {/* Row 2 */}
          <div className="mt-2 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-medium text-white">
                <AudioWaveform className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-white" aria-hidden="true" />
                No transcoding
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-400">
                Your audio is unaltered, so there is no loss of quality.
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-medium text-white">
                <LayoutDashboard className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-white" aria-hidden="true" />
                Simple
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-400">
                Clean design and clear workflow make Karhari Tube easy to use.
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-medium text-white">
                <Gauge className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-white" aria-hidden="true" />
                Quick
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-400">
                Render videos significantly faster than with tools such as Adobe Premiere Pro, Final Cut Pro, etc.
              </p>
            </div>
          </div>

          {/* Row 3 */}
          <div className="mt-2 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-medium text-white">
                <Puzzle className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-white" aria-hidden="true" />
                Feature rich
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-400">
                Loaded with extra features for the ideal user experience.
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-medium text-white">
                <Briefcase className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-white" aria-hidden="true" />
                Professional
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-400">
                Created with recording studios, musicians and producers in mind.
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-medium text-white">
                <ShieldCheck className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-white" aria-hidden="true" />
                Safe
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-neutral-400">
                Karhari Tube never has access to your password, all authentication is performed via the{" "}
                <a
                  className="text-white underline hover:text-neutral-200"
                  href="https://developers.google.com/youtube/terms/developer-policies#definition-youtube-api-services"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  YouTube API.
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === MID AD (TTT: between info and upgrade sections, visible on all visits) === */}
      <div className="mx-auto max-w-[1140px] px-4 py-6 sm:px-6 xl:px-12">
        <AdSlot slot="7460325809" label="Advertisement" className="bg-white" />
      </div>

      {/* === UPGRADE FEATURES SECTION (Light background) === */}
      <section className="upgrade-features-on-home py-12 md:py-16" aria-labelledby="upgrade-features-heading">
        <div className="mx-auto max-w-[1140px] px-4 sm:px-6 xl:px-12">
          <h2
            id="upgrade-features-heading"
            className="mx-auto max-w-[960px] pb-10 text-center text-[26px] sm:text-[30px] md:text-[34px] font-light leading-snug text-[#212529]"
            style={{ letterSpacing: "-0.08rem" }}
          >
            Alongside the free YouTube upload service, you can upgrade your account to access a range of
            additional features:
          </h2>

          {/* Row 1 */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-semibold text-[#212529]">
                <ImageOff className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-[#212529]" aria-hidden="true" />
                No watermark
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">
                The watermark is removed by default
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-semibold text-[#212529]">
                <ListChecks className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-[#212529]" aria-hidden="true" />
                Batch Upload Mode
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">
                Process 50 audio files at once
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-semibold text-[#212529]">
                <CalendarDays className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-[#212529]" aria-hidden="true" />
                Scheduled Uploads
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">
                Set a date and time in the future for your upload to go live
              </p>
            </div>
          </div>

          {/* Row 2 */}
          <div className="mt-2 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-semibold text-[#212529]">
                <TrendingUp className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-[#212529]" aria-hidden="true" />
                Increased Upload Quota
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">
                Upload as many videos as your daily YouTube quota allows.
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-semibold text-[#212529]">
                <MegaphoneOff className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-[#212529]" aria-hidden="true" />
                No Ads
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">
                A completely clean, ad-free experience
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-semibold text-[#212529]">
                <FileAudio className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-[#212529]" aria-hidden="true" />
                WAV / FLAC Uploads
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">
                Support for lossless audio formats such as WAV or FLAC
              </p>
            </div>
          </div>

          {/* Row 3 */}
          <div className="mt-2 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-semibold text-[#212529]">
                <CloudUpload className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-[#212529]" aria-hidden="true" />
                SoundCloud&reg; uploads
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">
                Send your MP3 and image to SoundCloud at the same time you post to YouTube
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-semibold text-[#212529]">
                <CloudDownload className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-[#212529]" aria-hidden="true" />
                SoundCloud&reg; downloads
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">
                Transfer files from your SoundCloud account into the upload queue without leaving Karhari Tube
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-semibold text-[#212529]">
                <AudioLines className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-[#212529]" aria-hidden="true" />
                VP9 Audio Codec
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">
                Upload videos at higher resolutions to force YouTube to apply a higher quality audio codec
              </p>
            </div>
          </div>

          {/* Row 4 */}
          <div className="mt-2 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-semibold text-[#212529]">
                <Save className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-[#212529]" aria-hidden="true" />
                Save description and tags
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">
                To avoid having to copy them every time.
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-semibold text-[#212529]">
                <SlidersHorizontal className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-[#212529]" aria-hidden="true" />
                Default states
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">
                Live / Private, tick-boxes, etc. on the upload form
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-semibold text-[#212529]">
                <Tags className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-[#212529]" aria-hidden="true" />
                Use ID3 Tags
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">
                Extract ID3 information from MP3s and dynamically put into the title, description, and tags
              </p>
            </div>
          </div>

          {/* Row 5 */}
          <div className="mt-2 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-semibold text-[#212529]">
                <ImageIcon className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-[#212529]" aria-hidden="true" />
                Use ID3 Images
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">
                Extract the image from the music file&#039;s ID3 tag and use it as the background
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-semibold text-[#212529]">
                <FileImage className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-[#212529]" aria-hidden="true" />
                Save a background image
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">
                So you don&#039;t need to re-upload for your future videos
              </p>
            </div>

            <div className="p-4 sm:p-5">
              <h4 className="flex items-center text-[19px] font-semibold text-[#212529]">
                <Link2 className="mr-2 h-5 w-5 shrink-0 stroke-[2] text-[#212529]" aria-hidden="true" />
                Upload files via a URL
              </h4>
              <p className="mt-2 text-[14.5px] leading-relaxed text-zinc-600">
                Transfers files hosted on your website, Dropbox&reg;, and other services
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === FOOTER ADS (TTT: two footer slots 6715370483 + 5967658073) === */}
      <div className="mx-auto max-w-[1140px] space-y-4 px-4 py-8 sm:px-6 xl:px-12">
        <AdSlot slot="6715370483" label="Advertisement — Footer 1" className="bg-white" />
        <AdSlot slot="5967658073" label="Advertisement — Footer 2" className="bg-white" />
      </div>
    </div>
  );
}
