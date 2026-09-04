"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function VisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    // only count public pages for AdSense-relevant metrics
    if (pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin") || pathname?.startsWith("/api")) return;
    fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname || "/" }),
    }).catch(() => {});
  }, [pathname]);
  return null;
}
