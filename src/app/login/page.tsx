"use client";
import Link from "next/link";
import { OAuthButton } from "@/components/OAuthButton";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-16 sm:px-6">
      <div className="rounded-2xl border bg-white p-8 text-center">
        <h1 className="text-xl font-semibold">Sign in to continue</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Choose your provider. We will request YouTube or Facebook permissions to list your channels/pages and upload.
        </p>
        <div className="mt-6 flex flex-col items-stretch gap-3">
          <OAuthButton
            provider="google"
            callbackUrl="/dashboard"
            variant="custom"
            className="w-full rounded-full bg-black py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          />
          <OAuthButton
            provider="facebook"
            callbackUrl="/dashboard"
            variant="custom"
            className="w-full rounded-full bg-[#1877F2] py-3 text-sm font-semibold text-white hover:bg-[#166fe5] disabled:opacity-60"
          />
        </div>
        <p className="mt-4 text-xs text-zinc-500">You can link the other provider later in Settings → Connections.</p>
        <Link href="/" className="mt-6 inline-block text-sm underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}
