import type { Metadata } from "next";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Karhari Tube by email for support, privacy, and AdSense verification. We respond within 1–2 business days.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Karhari Tube",
    description: "Email contacts for support, privacy, and AdSense verification.",
    url: "/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold">Contact</h1>
      <p className="mt-2 text-sm text-zinc-600">
        We respond within 1–2 business days. For AdSense verification, this page satisfies the
        contact requirement.
      </p>
      <div className="mt-6 rounded-xl border bg-white p-6 text-sm leading-7">
        <div>
          <span className="font-medium">Email</span> —{" "}
          <a href="mailto:support@karharimedia.com" className="underline">
            support@karharimedia.com
          </a>
        </div>
        <div>
          <span className="font-medium">Privacy</span> —{" "}
          <a href="mailto:privacy@karharimedia.com" className="underline">
            privacy@karharimedia.com
          </a>
        </div>
        <div className="mt-4 text-xs text-zinc-500">
          Tip: include your job ID (from /dashboard/jobs) when asking about a video.
        </div>
      </div>
      <ContactForm />
    </div>
  );
}
