import type { Metadata } from "next";
import { Outfit, DM_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Providers } from "@/components/Providers";
import { VisitTracker } from "@/components/VisitTracker";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://karharimedia.org";
const SITE_NAME = "Karhari Tube";
const SITE_DESC =
  "Free online tool to turn your MP3 or WAV audio and a cover image into a 1080p video and upload it directly to your YouTube channel or Facebook Page. Choose Bars or Circular visualizer, no watermark, no signup required for trial.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} - Upload MP3 to YouTube & Facebook`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: [
    "mp3 to youtube",
    "audio to youtube video",
    "mp3 to video converter",
    "youtube uploader",
    "facebook video upload",
    "audio visualizer video",
    "tunestotube alternative",
    "karhari tube",
    "convert mp3 to mp4",
    "upload music to youtube",
  ],
  authors: [{ name: "Karhari Media", url: SITE_URL }],
  creator: "Karhari Media",
  publisher: "Karhari Media",
  category: "Multimedia",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Upload MP3 to YouTube & Facebook`,
    description: SITE_DESC,
    images: [
      { url: "/images/karhari-media-b1.png", width: 1200, height: 630, alt: SITE_NAME },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Upload MP3 to YouTube & Facebook`,
    description: SITE_DESC,
    images: ["/images/karhari-media-b1.png"],
  },
  icons: {
    icon: [{ url: "/kfavicon.png", type: "image/png", sizes: "512x512" }],
    shortcut: "/kfavicon.png",
    apple: "/kfavicon.png",
  },
  manifest: "/site.webmanifest",
  verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESC,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any (web browser)",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", ratingCount: "127" },
  publisher: { "@type": "Organization", name: "Karhari Media", url: SITE_URL },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSans.variable} h-full antialiased`}>
      <head>
        <meta name="theme-color" content="#f8f9fa" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
