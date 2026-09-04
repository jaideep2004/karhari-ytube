import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@napi-rs/canvas", "fluent-ffmpeg", "ffmpeg-static", "ffprobe-static"],
  // increase body size for uploads (R2 presigned bypasses Vercel limit, but keep generous)
  experimental: {
    serverActions: {
      bodySizeLimit: "200mb",
    },
  },
};

export default nextConfig;
