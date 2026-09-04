import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200/80 bg-[#f8f9fa] py-8 text-zinc-600">
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6 xl:px-12">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-center text-[15px] text-zinc-500 md:text-left">
            <span>
              &copy; 2026 &nbsp;&middot;&nbsp;{" "}
              <Link href="/terms" className="text-zinc-600 underline hover:text-black">
                Terms &amp; Conditions
              </Link>{" "}
              |{" "}
              <Link href="/privacy" className="text-zinc-600 underline hover:text-black">
                Privacy Policy
              </Link>
            </span>
          </div>
          <div className="flex justify-center md:justify-end">
            <img
              id="developedByYouTube"
              src="/images/developed-with-youtube-dark-lowercase.svg"
              alt="developed with YouTube"
              className="h-auto w-[240px] sm:w-[280px] md:w-[300px]"
            />
          </div>
        </div>

        {/* Google Translate Selector Replica */}
        <div className="mt-8 flex flex-col items-center justify-center gap-1 text-center text-xs text-zinc-500">
          <div className="flex items-center gap-1 rounded border border-zinc-300 bg-white px-2 py-1 shadow-sm">
            <span className="text-[11px] text-zinc-400">Select Language</span>
            <select
              aria-label="Select Language"
              className="bg-transparent text-xs text-zinc-700 outline-none cursor-pointer"
              defaultValue="en"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
              <option value="pt">Português</option>
              <option value="ru">Русский</option>
              <option value="ja">日本語</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>
          <div className="mt-1 text-[10px] text-zinc-400">
            Powered by <span className="font-semibold text-zinc-600">Google</span> Translate
          </div>
        </div>
      </div>
    </footer>
  );
}