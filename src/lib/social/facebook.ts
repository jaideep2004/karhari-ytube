import https from "https";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { r2 } from "@/lib/storage/r2Provider";

const FB_GRAPH_API = "https://graph.facebook.com/v19.0";

function fbPost(pathAndQuery: string, signal?: AbortSignal): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const u = new URL(FB_GRAPH_API + pathAndQuery.split("?")[0]);
    // pathAndQuery includes query string; handle full path
    const fullPath = pathAndQuery;
    const req = https.request(
      {
        hostname: u.hostname,
        path: fullPath,
        method: "POST",
        timeout: 300_000,
        headers: { "Content-Length": "0" },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += typeof c === "string" ? c : c.toString()));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`Facebook API error (${res.statusCode}): ${body.slice(0, 400)}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new Error(`Facebook invalid JSON: ${body.slice(0, 400)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Facebook API timed out"));
    });
    const onAbort = () => req.destroy(new Error("Upload cancelled"));
    signal?.addEventListener("abort", onAbort, { once: true });
    req.on("close", () => signal?.removeEventListener("abort", onAbort));
    req.end();
  });
}

export async function uploadToFacebook(opts: {
  videoPath: string;
  r2VideoKey?: string; // if provided, reuse existing R2 upload; otherwise create temp
  r2PublicUrl?: string;
  title: string;
  description?: string;
  pageId: string;
  pageAccessToken: string;
  onProgress?: (pct: number, bytes?: number, total?: number) => void;
  signal?: AbortSignal;
}): Promise<{ videoId: string; videoUrl: string }> {
  const { videoPath, title, description = "", pageId, pageAccessToken, onProgress, signal } = opts;
  const tag = "[Facebook]";
  if (!pageId || !pageAccessToken) throw new Error("Facebook pageId/accessToken required");
  if (!r2.isConfigured) throw new Error("R2 is not configured — cannot upload video for Facebook (requires public file_url)");

  // 1. Upload file to R2 as temp if no r2PublicUrl provided
  let r2Key = opts.r2VideoKey || "";
  let r2PublicUrl = opts.r2PublicUrl || "";
  const isTempKey = !r2Key;

  if (!r2PublicUrl) {
    if (!r2Key) {
      const ext = path.extname(videoPath) || ".mp4";
      r2Key = `facebook-tmp/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    }
    const stat = await fsPromises.stat(videoPath);
    const totalBytes = stat.size;
    const signedUrl = await r2.generateSignedUploadUrl(r2Key, 3600);
    const r2Domain = r2.publicDomain;
    r2PublicUrl = `https://${r2Domain}/${r2Key}`;

    console.log(`${tag} Uploading ${totalBytes} bytes to R2 ${r2Key} for FB file_url`);

    await new Promise<void>((resolve, reject) => {
      const u = new URL(signedUrl);
      const req = https.request(
        {
          hostname: u.hostname,
          path: u.pathname + u.search,
          method: "PUT",
          timeout: 600_000,
          headers: {
            "Content-Type": "video/mp4",
            "Content-Length": String(totalBytes),
          },
        },
        (res) => {
          let body = "";
          res.on("data", (c) => (body += typeof c === "string" ? c : c.toString()));
          res.on("end", () => {
            if (res.statusCode !== 200) {
              reject(new Error(`R2 upload failed (${res.statusCode}): ${body.slice(0, 200)}`));
              return;
            }
            resolve();
          });
        }
      );
      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("R2 upload timed out"));
      });
      const onAbort = () => req.destroy(new Error("Upload cancelled"));
      signal?.addEventListener("abort", onAbort, { once: true });
      req.on("close", () => signal?.removeEventListener("abort", onAbort));

      const stream = fs.createReadStream(videoPath, { highWaterMark: 256 * 1024 });
      let bytesDone = 0;
      stream.on("data", (chunk: Buffer | string) => {
        const buf = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
        bytesDone += buf.length;
        const pct = Math.round((bytesDone / totalBytes) * 50) + 10;
        onProgress?.(Math.min(pct, 59), bytesDone, totalBytes);
        const canContinue = req.write(buf);
        if (!canContinue) stream.pause();
      });
      stream.on("end", () => req.end());
      stream.on("error", reject);
      req.on("drain", () => stream.resume());
    });

    console.log(`${tag} R2 upload complete: ${r2PublicUrl}`);
    onProgress?.(60);
  }

  if (signal?.aborted) throw new Error("Upload cancelled");

  try {
    console.log(`${tag} Calling FB API with file_url for page ${pageId}...`);
    const u = `${FB_GRAPH_API}/${pageId}/videos?file_url=${encodeURIComponent(r2PublicUrl)}&title=${encodeURIComponent(title.slice(0, 100))}&description=${encodeURIComponent(description.slice(0, 5000))}&published=true&access_token=${encodeURIComponent(pageAccessToken)}`;
    const res = await fetch(u, { method: "POST", signal: signal as never });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) throw new Error(`Facebook API error (${res.status}): ${JSON.stringify(body).slice(0, 400)}`);
    const videoId = (body.id as string) || "";
    if (!videoId) throw new Error(`Facebook did not return video ID: ${JSON.stringify(body)}`);
    console.log(`${tag} Facebook accepted: video_id=${videoId}`);
    onProgress?.(100);
    return { videoId, videoUrl: `https://facebook.com/${pageId}/videos/${videoId}` };
  } finally {
    if (isTempKey && r2Key) {
      r2.deleteFile(r2Key).catch((e: Error) => console.warn(`${tag} Failed to clean up R2 ${r2Key}: ${e.message}`));
    }
  }
}
