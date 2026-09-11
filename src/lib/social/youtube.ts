import fsPromises from "fs/promises";
import https from "https";
// Reuse parent's proven chunked resumable logic — simplified for standalone

function httpsRequestPromise(
  url: URL,
  httpsRequest: typeof https.request,
  opts: { method: string; headers?: Record<string, string>; body?: Buffer }
): Promise<{ statusCode: number; headers: Record<string, string>; body: string }> {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: opts.method,
        headers: opts.headers,
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += typeof c === "string" ? c : c.toString()));
        res.on("end", () =>
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers as Record<string, string>,
            body,
          })
        );
      }
    );
    req.on("error", reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

async function initiateUpload(
  accessToken: string,
  fileSize: number,
  title: string,
  description: string,
  visibility: string,
  scheduleAt?: string,
  tags?: string[]
): Promise<string> {
  const metadata: Record<string, unknown> = {
    snippet: {
      title,
      description,
      ...(tags && tags.length ? { tags } : {}),
    },
    status: {
      privacyStatus: visibility,
      selfDeclaredMadeForKids: false,
      notifySubscribers: false,
      ...(scheduleAt ? { publishAt: new Date(scheduleAt).toISOString() } : {}),
    },
  };

  let lastErr: Error | undefined;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Upload-Content-Length": String(fileSize),
          },
          body: JSON.stringify(metadata),
        }
      );
      if (res.status === 401) throw new Error("YouTube access token expired or invalid. Reconnect the channel.");
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`YouTube upload initiation failed (${res.status}): ${body}`);
      }
      const location = res.headers.get("Location");
      if (!location) throw new Error("YouTube did not return an upload URL");
      return location;
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      console.error(`[YouTube] Initiation attempt ${attempt}/3 failed:`, lastErr.message);
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 5000));
    }
  }
  throw lastErr!;
}

async function queryUploadStatus(
  uploadUrl: URL,
  fileSize?: number
): Promise<number> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const headers: Record<string, string> = {
        "Content-Length": "0",
        "Content-Type": "video/*",
      };
      if (fileSize) headers["Content-Range"] = `bytes */${fileSize}`;
      const result = await httpsRequestPromise(uploadUrl, https.request, {
        method: "PUT",
        headers,
      });
      if (result.statusCode === 308) {
        const range = result.headers["range"] || result.headers["Range"];
        if (range) {
          const m = /bytes=0-(\d+)/.exec(range);
          if (m) return parseInt(m[1], 10) + 1;
        }
        return 0;
      }
      if (result.statusCode >= 200 && result.statusCode < 300) {
        // already complete — extract id if present
        try {
          const body = JSON.parse(result.body);
          if (body?.id) return fileSize || 0;
        } catch {}
        return 0;
      }
      throw new Error(`queryUploadStatus failed: ${result.statusCode} ${result.body.slice(0, 200)}`);
    } catch (err) {
      if (attempt === 2) throw err;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return 0;
}

async function sendChunkWithRetry(
  uploadUrl: URL,
  buf: Buffer,
  start: number,
  end: number,
  fileSize: number,
  signal?: AbortSignal,
  retries = 3
): Promise<{ complete: boolean; videoId?: string; resumeAt?: number }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    if (signal?.aborted) throw new Error("Upload cancelled");
    try {
      const headers: Record<string, string> = {
        "Content-Length": String(buf.length),
        "Content-Type": "video/*",
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      };
      const result = await httpsRequestPromise(uploadUrl, https.request, {
        method: "PUT",
        headers,
        body: buf,
      });
      if (result.statusCode === 308) {
        const range = result.headers["range"] || result.headers["Range"];
        if (range) {
          const m = /bytes=0-(\d+)/.exec(range);
          if (m) {
            const resumeAt = parseInt(m[1], 10) + 1;
            return { complete: false, resumeAt };
          }
        }
        return { complete: false };
      }
      if (result.statusCode >= 200 && result.statusCode < 300) {
        let videoId: string | undefined;
        try {
          const body = JSON.parse(result.body);
          videoId = body?.id || body?.snippet?.id;
          // fallback: sometimes id is in body directly
          if (!videoId && typeof body === "object") {
            // try to find id anywhere
            videoId = body.id;
          }
        } catch {
          // if body not JSON, try to extract?
        }
        return { complete: true, videoId };
      }
      // Check if we should retry: 5xx or 308-like
      if (result.statusCode >= 500 && attempt < retries) {
        console.warn(`[YouTube] chunk ${start}-${end} got ${result.statusCode}, retry ${attempt}/${retries}`);
        await new Promise((r) => setTimeout(r, attempt * 2000));
        continue;
      }
      throw new Error(`Chunk upload failed (${result.statusCode}): ${result.body.slice(0, 300)}`);
    } catch (err) {
      if (attempt < retries && !(err instanceof Error && err.message.includes("cancelled"))) {
        console.warn(`[YouTube] chunk error attempt ${attempt}/${retries}:`, (err as Error).message);
        await new Promise((r) => setTimeout(r, attempt * 2000));
        // query server position before retry
        try {
          const resumeAt = await queryUploadStatus(uploadUrl, fileSize);
          if (resumeAt > start) {
            console.log(`[YouTube] server has bytes 0-${resumeAt - 1}, resuming at ${resumeAt}`);
            return { complete: false, resumeAt };
          }
        } catch {}
        continue;
      }
      throw err;
    }
  }
  throw new Error("Chunk upload retries exhausted");
}

export async function uploadToYoutube(opts: {
  videoPath: string;
  title: string;
  description?: string;
  tags?: string[];
  accessToken: string;
  visibility?: string;
  scheduleAt?: string;
  onProgress?: (pct: number, bytes?: number, total?: number) => void;
  signal?: AbortSignal;
}): Promise<{ videoId: string; videoUrl: string }> {
  const { videoPath, title, description = "", tags, accessToken, visibility = "public", scheduleAt, onProgress, signal } = opts;
  const stat = await fsPromises.stat(videoPath);
  const fileSize = stat.size;
  const TAG = "[YouTube]";
  const CHUNK_SIZE = 5 * 1024 * 1024;
  console.log(`${TAG} Starting chunked upload of ${fileSize} bytes tagCount=${tags?.length ?? 0}`);

  const uploadUrlStr = await initiateUpload(accessToken, fileSize, title.slice(0, 100), description.slice(0, 5000), visibility, scheduleAt, tags?.slice(0, 15));
  const uploadUrl = new URL(uploadUrlStr);
  console.log(`${TAG} Initiation OK`);

  const fd = await fsPromises.open(videoPath, "r");
  try {
    let uploadedBytes = await queryUploadStatus(uploadUrl, fileSize);
    console.log(`${TAG} Starting from byte ${uploadedBytes}/${fileSize}`);
    // eslint-disable-next-line no-constant-condition
    while (uploadedBytes < fileSize) {
      if (signal?.aborted) throw new Error("Upload cancelled");
      const chunkEnd = Math.min(uploadedBytes + CHUNK_SIZE, fileSize);
      const chunkSize = chunkEnd - uploadedBytes;
      const buf = Buffer.alloc(chunkSize);
      await fd.read(buf, 0, chunkSize, uploadedBytes);
      const result = await sendChunkWithRetry(uploadUrl, buf, uploadedBytes, chunkEnd - 1, fileSize, signal);
      if (result.complete) {
        onProgress?.(100, fileSize, fileSize);
        const videoId = result.videoId;
        if (!videoId || typeof videoId !== "string" || videoId.length < 5) {
          throw new Error(`YouTube returned unexpected video ID: ${JSON.stringify(videoId)}`);
        }
        return { videoId, videoUrl: `https://youtu.be/${videoId}` };
      }
      if (result.resumeAt != null) uploadedBytes = result.resumeAt;
      else uploadedBytes = chunkEnd;
      const pct = Math.round((uploadedBytes / fileSize) * 100);
      onProgress?.(pct, uploadedBytes, fileSize);
      console.log(`${TAG} Uploaded ${uploadedBytes}/${fileSize} (${pct}%)`);
    }
    throw new Error("Upload finished but no video ID was returned");
  } finally {
    await fd.close();
  }
}

// Token refresh helper for karhari-tube Google OAuth
export async function refreshYoutubeAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: Date }> {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || "";
  if (!clientId || !clientSecret) throw new Error("GOOGLE_CLIENT_ID/SECRET not configured for token refresh");
  if (!refreshToken) throw new Error("No refresh_token available — user must reconnect Google");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Token refresh failed (${res.status}): ${JSON.stringify(data)}`);
  const accessToken = data.access_token as string;
  const expiresIn = (data.expires_in as number) || 3600;
  if (!accessToken) throw new Error("No access_token in refresh response");
  return { accessToken, expiresAt: new Date(Date.now() + (expiresIn - 60) * 1000) };
}
