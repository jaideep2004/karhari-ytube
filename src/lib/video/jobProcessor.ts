import path from "path";
import fs from "fs/promises";
import os from "os";
import { r2 } from "@/lib/storage/r2Provider";
import { SOCIAL_VIDEO_DIR, UPLOAD_DIR } from "@/lib/config";
import { getVideoJob, updateVideoJob, setJobProgress } from "@/lib/db/videoJobs";
import { getDb } from "@/lib/db/mongo";
import { decryptToken } from "@/lib/auth/tokenVault";
import { ObjectId } from "mongodb";

async function downloadKeyToTmp(r2Key: string, tmpDir: string): Promise<string> {
  const basename = path.basename(r2Key);
  const tmpPath = path.join(tmpDir, basename);
  if (r2.isConfigured) {
    // 1) SDK streaming download — most reliable (retries, avoids fetch/undici IPv6 UND_ERR_SOCKET)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await r2.downloadToFile(r2Key, tmpPath);
        // verify file exists and has size
        const st = await fs.stat(tmpPath);
        if (st.size === 0) throw new Error("downloaded 0 bytes");
        return tmpPath;
      } catch (e) {
        await fs.unlink(tmpPath).catch(() => {});
        const msg = e instanceof Error ? e.message : String(e);
        const isLast = attempt === 3;
        console.warn(`[job] R2 SDK download attempt ${attempt}/3 failed for ${r2Key}: ${msg}${isLast ? " — trying signed URL fallback" : ""}`);
        if (!isLast) await new Promise((r) => setTimeout(r, attempt * 800));
        else {
          // fall through to signed URL
        }
      }
    }
    // 2) Signed URL + fetch fallback (streaming, with retry) — handles edge SDK permission quirks
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const url = await r2.generateSignedDownloadUrl(r2Key, 3600);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to download ${r2Key}: ${res.status} ${res.statusText}`);
        // stream to file instead of arrayBuffer to handle 200 MB without OOM + avoid UND_ERR_SOCKET buffering issues
        if (res.body) {
          const { createWriteStream } = await import("fs");
          await new Promise<void>((resolve, reject) => {
            const ws = createWriteStream(tmpPath);
            const reader = (res.body as unknown as NodeJS.ReadableStream & { pipe?: unknown }) as NodeJS.ReadableStream;
            // undici body is web stream — convert via pipe if possible, else buffer
            if (typeof (reader as unknown as { pipe?: unknown }).pipe === "function") {
              (reader as NodeJS.ReadableStream).pipe(ws);
              ws.on("finish", resolve);
              ws.on("error", reject);
              (reader as NodeJS.ReadableStream).on("error", reject);
            } else {
              // web stream fallback: buffer then write (still retryable)
              res.arrayBuffer().then((ab) => fs.writeFile(tmpPath, Buffer.from(ab)).then(() => resolve()).catch(reject)).catch(reject);
            }
          });
        } else {
          const buf = Buffer.from(await res.arrayBuffer());
          await fs.writeFile(tmpPath, buf);
        }
        const st = await fs.stat(tmpPath);
        if (st.size === 0) throw new Error("signed URL downloaded 0 bytes");
        return tmpPath;
      } catch (e) {
        await fs.unlink(tmpPath).catch(() => {});
        console.warn(`[job] R2 signed URL download attempt ${attempt}/2 failed for ${r2Key}`, e);
        if (attempt < 2) await new Promise((r) => setTimeout(r, 800));
      }
    }
    // after SDK + signed URL both failed, fall through to local candidates before throwing
  }
  const localCandidates = [
    path.join(UPLOAD_DIR, r2Key),
    path.join(UPLOAD_DIR, "audio", basename),
    path.join(UPLOAD_DIR, "artwork", basename),
    path.join(os.tmpdir(), basename),
  ];
  for (const p of localCandidates) {
    try {
      await fs.access(p);
      await fs.copyFile(p, tmpPath);
      return tmpPath;
    } catch {}
  }
  throw new Error(`Cannot resolve media file: ${r2Key}`);
}

async function getUserForJob(userId: ObjectId) {
  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: userId });
  return user as unknown as
    | {
        _id: ObjectId;
        email: string;
        google?: { accessTokenEnc?: string; refreshTokenEnc?: string; expiresAt?: Date | string };
        facebook?: { accessTokenEnc?: string; pages?: { id: string; name: string; accessTokenEnc: string }[] };
      }
    | null;
}

async function getValidGoogleAccessToken(userId: ObjectId): Promise<string> {
  const user = await getUserForJob(userId);
  if (!user?.google?.accessTokenEnc) throw new Error("Google not connected — token missing");
  const enc = user.google.accessTokenEnc;
  const refreshEnc = user.google.refreshTokenEnc;
  const expiresAt = user.google.expiresAt ? new Date(user.google.expiresAt) : null;

  let accessToken = decryptToken(enc);
  const refreshToken = refreshEnc ? decryptToken(refreshEnc) : "";

  const isExpired = !expiresAt || expiresAt.getTime() - Date.now() < 5 * 60 * 1000;
  if (isExpired && refreshToken) {
    console.log("[job] YouTube token expired, refreshing");
    const { refreshYoutubeAccessToken } = await import("@/lib/social/youtube");
    const refreshed = await refreshYoutubeAccessToken(refreshToken);
    accessToken = refreshed.accessToken;
    // persist refreshed token encrypted
    const { encryptToken } = await import("@/lib/auth/tokenVault");
    const db = await getDb();
    await db.collection("users").updateOne(
      { _id: userId },
      { $set: { "google.accessTokenEnc": encryptToken(accessToken), "google.expiresAt": refreshed.expiresAt } }
    );
    console.log("[job] YouTube token refreshed, new expiry", refreshed.expiresAt.toISOString());
  } else if (isExpired && !refreshToken) {
    console.warn("[job] YouTube token expired and no refresh_token — will try anyway");
  }
  return accessToken;
}

function getFacebookPageToken(
  user: NonNullable<Awaited<ReturnType<typeof getUserForJob>>>,
  pageId: string
): string {
  if (!user.facebook) throw new Error("Facebook not connected");
  const pages = user.facebook.pages || [];
  const match = pages.find((p) => p.id === pageId);
  if (match?.accessTokenEnc) return decryptToken(match.accessTokenEnc);
  // fallback: if no pages, try top-level accessTokenEnc (user token) — but page upload needs page token
  // try first page if pageId not found
  if (pages[0]?.accessTokenEnc && !pageId) return decryptToken(pages[0].accessTokenEnc);
  if (match) throw new Error(`Page token for ${pageId} missing`);
  throw new Error(`Facebook page ${pageId} not found in connected pages`);
}

export async function processVideoJob(jobId: string) {
  const tag = `[job:${jobId.slice(0, 6)}]`;
  console.log(`${tag} start`);
  const job = await getVideoJob(jobId);
  if (!job || !job._id) throw new Error("Job not found");

  const tmpDir = path.join(os.tmpdir(), `kt-job-${jobId}`);
  await fs.mkdir(tmpDir, { recursive: true });
  await fs.mkdir(SOCIAL_VIDEO_DIR, { recursive: true });

  try {
    await setJobProgress(job._id, "downloading", 10);
    const audioTmp = await downloadKeyToTmp(job.input.audioR2Key, tmpDir);
    console.log(`${tag} audio downloaded to ${audioTmp}`);

    let artworkTmp: string | undefined;
    if (job.input.artworkR2Key) {
      try {
        artworkTmp = await downloadKeyToTmp(job.input.artworkR2Key, tmpDir);
        console.log(`${tag} artwork downloaded to ${artworkTmp}`);
      } catch (e) {
        console.warn(`${tag} artwork download failed, will use gradient`, e);
      }
    }

    await setJobProgress(job._id, "generating", 30);

    const { generateVideo } = await import("./videoGeneration");
    const outputPath = path.join(SOCIAL_VIDEO_DIR, `${jobId}.mp4`);

    console.log(`${tag} generating preset=${job.input.preset} color=${job.input.color}`);
    const result = await generateVideo({
      audioPath: audioTmp,
      artworkPath: artworkTmp,
      title: job.input.title,
      artist: "",
      preset: job.input.preset,
      color: job.input.color,
      outputPath,
      hasArtwork: !!artworkTmp,
      onProgress: (pct) => {
        const overall = 30 + Math.round((pct / 100) * 50);
        setJobProgress(job._id!, "generating", overall).catch(() => {});
      },
    });

    console.log(`${tag} generated duration=${result.duration}s size=${result.fileSize}`);

    await setJobProgress(job._id, "uploading", 80);

    const r2VideoKey = `social-videos/${jobId}.mp4`;
    let r2Url = "";
    if (r2.isConfigured) {
      try {
        const up = await r2.uploadFile(result.outputPath, r2VideoKey, "video/mp4");
        r2Url = up.url || (r2.publicUrl ? `${r2.publicUrl}/${r2VideoKey}` : "");
        console.log(`${tag} uploaded to R2 ${r2VideoKey} -> ${r2Url}`);
      } catch (e) {
        console.warn(`${tag} R2 upload failed, keeping local`, e);
      }
    } else {
      console.log(`${tag} R2 not configured — video kept at ${result.outputPath}`);
    }

    // Destination uploads (YouTube / Facebook) — P4
    const destinationsInput = (job.destinations as { platform: string; channelId?: string; pageId?: string }[] | undefined) || [];
    const destResults: { platform: string; channelId?: string; pageId?: string; externalId?: string; videoUrl?: string; status: string; error?: string }[] = [];

    if (destinationsInput.length > 0) {
      console.log(`${tag} destinations: ${destinationsInput.map((d) => d.platform).join(", ")}`);

      // fetch user once for token handling
      const userDoc = await getUserForJob(job.userId);
      if (!userDoc) throw new Error("User not found for destination upload");

      for (let i = 0; i < destinationsInput.length; i++) {
        const d = destinationsInput[i];
        const pctBase = 80 + Math.round((i / destinationsInput.length) * 15);
        await setJobProgress(job._id, `uploading:${d.platform}`, pctBase).catch(() => {});

        if (d.platform === "youtube") {
          try {
            const accessToken = await getValidGoogleAccessToken(job.userId);
            const { uploadToYoutube } = await import("@/lib/social/youtube");
            const yt = await uploadToYoutube({
              videoPath: result.outputPath,
              title: job.input.title,
              description: job.input.description || `${job.input.title} — ${job.input.artist || ""}`.trim(),
              tags: (job.input as unknown as { tags?: string[] }).tags || undefined,
              accessToken,
              visibility: (job.input.visibility as string) || "public",
              scheduleAt: job.input.scheduleAt || undefined,
              onProgress: (pct) => {
                const overall = pctBase + Math.round((pct / 100) * (15 / destinationsInput.length));
                setJobProgress(job._id!, `uploading:youtube`, Math.min(95, overall)).catch(() => {});
              },
            });
            destResults.push({ platform: "youtube", channelId: d.channelId, externalId: yt.videoId, videoUrl: yt.videoUrl, status: "delivered" });
            console.log(`${tag} YouTube delivered ${yt.videoId}`);
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`${tag} YouTube failed: ${msg}`);
            destResults.push({ platform: "youtube", channelId: d.channelId, status: "failed", error: msg });
          }
        } else if (d.platform === "facebook") {
          try {
            if (!r2Url) throw new Error("R2 public URL required for Facebook — configure R2_PUBLIC_DOMAIN");
            const pageId = d.pageId || "";
            if (!pageId) throw new Error("Facebook pageId missing — pick a Page");
            // Ensure userDoc fresh (in case token refreshed? no for FB)
            const freshUser = (await getUserForJob(job.userId)) || userDoc;
            const pageToken = getFacebookPageToken(freshUser!, pageId);
            const { uploadToFacebook } = await import("@/lib/social/facebook");
            const fb = await uploadToFacebook({
              videoPath: result.outputPath,
              r2VideoKey,
              r2PublicUrl: r2Url,
              title: job.input.title,
              description: job.input.description || "",
              pageId,
              pageAccessToken: pageToken,
              onProgress: (pct) => {
                const overall = pctBase + Math.round((pct / 100) * (15 / destinationsInput.length));
                setJobProgress(job._id!, `uploading:facebook`, Math.min(95, overall)).catch(() => {});
              },
            });
            destResults.push({ platform: "facebook", pageId, externalId: fb.videoId, videoUrl: fb.videoUrl, status: "delivered" });
            console.log(`${tag} Facebook delivered ${fb.videoId}`);
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error(`${tag} Facebook failed: ${msg}`);
            destResults.push({ platform: "facebook", pageId: d.pageId, status: "failed", error: msg });
          }
        } else {
          destResults.push({ platform: d.platform, status: "failed", error: `Unknown platform ${d.platform}` });
        }
      }
      await setJobProgress(job._id, "uploading", 95).catch(() => {});
    }

    const hasDestinations = destinationsInput.length > 0;
    const allFailed = hasDestinations && destResults.length > 0 && destResults.every((r) => r.status === "failed");
    const finalStatus = allFailed ? "failed" : "done";
    const finalError = allFailed ? destResults.map((r) => `${r.platform}: ${r.error}`).join("; ") : undefined;

    await updateVideoJob(job._id, {
      status: finalStatus as never,
      output: {
        r2VideoKey,
        r2Url,
        duration: result.duration,
        fileSize: result.fileSize,
      },
      destinations: destResults as never,
      error: finalError || null,
      progress: { phase: finalStatus === "done" ? "done" : "failed", pct: finalStatus === "done" ? 100 : 0, updatedAt: new Date() },
    } as never);

    console.log(`${tag} finished status=${finalStatus} dest=${JSON.stringify(destResults)}`);

    setTimeout(() => fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {}), 60 * 60 * 1000).unref?.();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`${tag} failed: ${msg}`);
    const latest = await getVideoJob(jobId);
    const id = latest?._id || job._id;
    if (id) {
      await updateVideoJob(id, {
        status: "failed",
        error: msg,
        progress: { phase: "failed", pct: 0, updatedAt: new Date() },
      } as never);
    }
  }
}
