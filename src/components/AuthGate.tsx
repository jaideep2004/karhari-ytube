"use client";
import { OAuthButton } from "./OAuthButton";

export function AuthGate() {
  return (
    <div className="flex w-full max-w-[400px] flex-col items-start gap-3">
      <OAuthButton provider="google" callbackUrl="/" variant="google" />
      <OAuthButton provider="facebook" callbackUrl="/" variant="facebook" />
    </div>
  );
}
