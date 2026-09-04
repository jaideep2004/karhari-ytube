import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Providers } from "@/components/Providers";
import { VisitTracker } from "@/components/VisitTracker";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Karhari Tube - Upload MP3 to YouTube & Facebook",
  description:
    "TunesToTube-style — upload MP3/WAV + thumbnail, pick Bars or Circular visualizer, choose YouTube channel or Facebook page. We generate 1080p video and publish. No watermark.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f8f9fa]">
        <Providers>
          <VisitTracker />
          <Header />
          <main className="flex-1 bg-[#f8f9fa]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
