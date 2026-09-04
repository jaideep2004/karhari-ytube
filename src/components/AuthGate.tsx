"use client";
import { signIn } from "next-auth/react";

export function AuthGate() {
  return (
    <div className="flex w-full max-w-[400px] flex-col items-start gap-3">
      {/* Google Button */}
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="gsi-material-button"
        aria-label="Continue with Google"
      >
        <div className="gsi-material-button-state" />
        <div className="gsi-material-button-content-wrapper">
          <div className="gsi-material-button-icon">
            <svg
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              style={{ display: "block" }}
              aria-hidden="true"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
          </div>
          <span className="gsi-material-button-contents">Continue with Google</span>
          <span style={{ display: "none" }}>Continue with Google</span>
        </div>
      </button>

      {/* Facebook Button */}
      <button
        type="button"
        onClick={() => signIn("facebook", { callbackUrl: "/" })}
        className="flex h-[40px] w-full max-w-[400px] items-center justify-center gap-3 rounded-[20px] bg-[#1877F2] px-3 text-sm font-medium text-white transition-all hover:bg-[#166fe5] hover:shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] active:bg-[#1464cc]"
        aria-label="Continue with Facebook"
      >
        <div className="flex h-5 w-5 shrink-0 items-center justify-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.772-1.63 1.562V10h2.773l-.443 2.891h-2.33v6.987C16.343 19.128 20 14.991 20 10z"
              fill="white"
            />
          </svg>
        </div>
        <span className="font-['Outfit',arial,sans-serif] font-medium tracking-[0.25px]">
          Continue with Facebook
        </span>
      </button>
    </div>
  );
}
