import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/login", label: "Login" },
];

export function Footer() {
  return (
    <footer className="w-full border-t border-zinc-200/80 bg-[#f8f9fa] py-10 text-zinc-600">
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6 xl:px-12">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] text-zinc-600">
            {FOOTER_LINKS.map((l, i) => (
              <span key={l.href} className="flex items-center gap-5">
                <Link
                  href={l.href}
                  className="text-zinc-600 underline-offset-2 hover:text-black hover:underline"
                >
                  {l.label}
                </Link>
                {i < FOOTER_LINKS.length - 1 && (
                  <span className="text-zinc-300" aria-hidden>
                    |
                  </span>
                )}
              </span>
            ))}
          </div>
          <div className="flex flex-col items-start gap-1 md:items-end">
            <div className="text-[14px] text-zinc-500">
              &copy; {new Date().getFullYear()} Karhari Media
            </div>
            <img
              id="developedByYouTube"
              src="/images/developed-with-youtube-dark-lowercase.svg"
              alt="developed with YouTube"
              className="h-auto w-[200px] sm:w-[240px] md:w-[280px]"
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
