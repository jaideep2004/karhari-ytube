import { auth } from "@/auth";
import { findUserByEmail } from "@/lib/db/users";
import { getVideoJob, updateVideoJob } from "@/lib/db/videoJobs";
import { getDb } from "@/lib/db/mongo";
import { decryptToken } from "@/lib/auth/tokenVault";
import { r2 } from "@/lib/storage/r2Provider";
import { SOCIAL_VIDEO_DIR } from "@/lib/config";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min for uploads

async function getUserForDeliver(userId: import("mongodb").ObjectId) {
  const db = await getDb();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return db.collection("users").findOne({ _id: userId }) as Promise<any>;
}

async function getValidGoogleAccessToken(userId: import("mongodb").ObjectId): Promise<string> {
  const user = (await getUserForDeliver(userId)) as unknown as { google?: { accessTokenEnc?: string; refreshTokenEnc?: string; expiresAt?: Date | string } } | null;
  if (!user?.google?.accessTokenEnc) throw new Error("Google not connected — token missing");
  const enc = user.google.accessTokenEnc;
  const refreshEnc = user.google.refreshTokenEnc;
  const expiresAt = user.google.expiresAt ? new Date(user.google.expiresAt) : null;
  let accessToken = decryptToken(enc);
  const refreshToken = refreshEnc ? decryptToken(refreshEnc) : "";
  const isExpired = !expiresAt || expiresAt.getTime() - Date.now() < 5 * 60 * 1000;
  if (isExpired && refreshToken) {
    const { refreshYoutubeAccessToken } = await import("@/lib/social/youtube");
    const refreshed = await refreshYoutubeAccessToken(refreshToken);
    accessToken = refreshed.accessToken;
    const { encryptToken } = await import("@/lib/auth/tokenVault");
    const db = await getDb();
    await db.collection("users").updateOne({ _id: userId }, { $set: { "google.accessTokenEnc": encryptToken(accessToken), "google.expiresAt": refreshed.expiresAt } });
  } else if (isExpired && !refreshToken) {
    console.warn("[deliver] YouTube token expired and no refresh_token");
  }
  return accessToken;
}

function getFacebookPageToken(user: NonNullable<Awaited<ReturnType<typeof getUserForDeliver>>>, pageId: string): string {
  const u = user as unknown as { facebook?: { pages?: { id: string; accessTokenEnc: string }[]; accessTokenEnc?: string } };
  if (!u.facebook) throw new Error("Facebook not connected");
  const pages = u.facebook.pages || [];
  const match = pages.find((p) => p.id === pageId);
  if (match?.accessTokenEnc) return decryptToken(match.accessTokenEnc);
  if (pages[0]?.accessTokenEnc && !pageId) return decryptToken(pages[0].accessTokenEnc);
  throw new Error(`Facebook page ${pageId} not found — reconnect Facebook and pick a Page`);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Not authenticated" }, { status: 401 });

  let body: Record<string, unknown> | null = null;
  try { body = await req.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const platform = body?.platform as string;
  const channelId = body?.channelId as string | undefined;
  const pageId = body?.pageId as string | undefined;

  if (platform !== "youtube" && platform !== "facebook") return Response.json({ error: "platform must be youtube or facebook" }, { status: 400 });
  if (platform === "facebook" && !pageId) return Response.json({ error: "pageId required for Facebook" }, { status: 400 });

  let user;
  try { user = await findUserByEmail(session.user.email); } catch { return Response.json({ error: "DB not configured" }, { status: 500 }); }
  if (!user?._id) return Response.json({ error: "User not found" }, { status: 404 });

  const job = await getVideoJob(id);
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });
  if (String(job.userId) !== String(user._id) && (user as unknown as { role?: string }).role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

  // Must have generated video
  const r2VideoKey = job.output?.r2VideoKey || `social-videos/${id}.mp4`;
  const localVideoPath = path.join(SOCIAL_VIDEO_DIR, `${id}.mp4`);
  let videoPath = localVideoPath;
  let r2Url = job.output?.r2Url || "";

  // Check local file exists, else try to resolve via R2
  try { await fs.access(videoPath); } catch {
    // No local file — try R2 download URL as fallback? For deliver we need local file for YouTube, and R2 URL for Facebook
    // If local missing but r2Url exists, we can download from R2 to tmp for YouTube
    if (platform === "youtube" && r2Url) {
      const tmpPath = path.join(SOCIAL_VIDEO_DIR, `deliver_${id}_${Date.now()}.mp4`);
      try {
        const res = await fetch(r2Url);
        if (!res.ok) throw new Error(`Failed to fetch R2 video: ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        await fs.writeFile(tmpPath, buf);
        videoPath = tmpPath;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return Response.json({ error: `Video not found locally and R2 fetch failed: ${msg}. Video may have been cleaned up.` }, { status: 404 });
      }
    } else if (!r2Url) {
      return Response.json({ error: "Video not ready — no output yet (generate first)" }, { status: 400 });
    }
  }

  // For Facebook, need R2 public URL — if missing, try to upload local to R2 now
  if (platform === "facebook" && !r2Url) {
    if (!r2.isConfigured) return Response.json({ error: "R2 not configured — set R2_PUBLIC_DOMAIN to enable Facebook upload (requires public file_url)" }, { status: 400 });
    try {
      const up = await r2.uploadFile(videoPath, r2VideoKey, "video/mp4");
      r2Url = up.url || (r2.publicUrl ? `${r2.publicUrl}/${r2VideoKey}` : "");
      if (!r2Url) throw new Error("R2 upload succeeded but no public URL");
      // persist r2Url for future
      await updateVideoJob(job._id!, { output: { ...(job.output || {}), r2VideoKey, r2Url } } as never);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return Response.json({ error: `R2 upload failed for Facebook: ${msg}` }, { status: 500 });
    }
  }

  if (job.status !== "done" && job.status !== "failed") {
    return Response.json({ error: `Job not ready — status is ${job.status} (wait for done)` }, { status: 400 });
  }

  // Check duplicate deliver (optional allow retry if previous failed)
  const existing = (job.destinations || []).find((d) => d.platform === platform && (platform === "youtube" ? true : d.pageId === pageId));
  if (existing?.status === "delivered") {
    return Response.json({ error: `Already delivered to ${platform}${platform === "facebook" ? ` page ${pageId}` : ""} — videoUrl: ${existing.videoUrl}` }, { status: 409 });
  }

  try {
    if (platform === "youtube") {
      const accessToken = await getValidGoogleAccessToken(job.userId);
      const { uploadToYoutube } = await import("@/lib/social/youtube");
      const title = (body?.title as string) || job.input.title;
      const description = (body?.description as string) || job.input.description || `${job.input.title} — ${job.input.artist || ""}`.trim();
      const visibility = (body?.visibility as string) || (job.input.visibility as string) || "public";
      const scheduleAt = (body?.scheduleAt as string) || job.input.scheduleAt || undefined;
      const yt = await uploadToYoutube({
        videoPath,
        title,
        description,
        accessToken,
        visibility,
        scheduleAt: scheduleAt || undefined,
        onProgress: () => {},
      });
      const newDest = { platform: "youtube", channelId, externalId: yt.videoId, videoUrl: yt.videoUrl, status: "delivered" as const };
      const updatedDests = [...(job.destinations || []).filter((d) => !(d.platform === "youtube" && d.channelId === channelId)), newDest];
      await updateVideoJob(job._id!, { destinations: updatedDests as never } as never);
      const updated = await getVideoJob(id);
      return Response.json({ ok: true, videoId: yt.videoId, videoUrl: yt.videoUrl, job: updated });
    } else {
      const dbUser = await getUserForDeliver(job.userId);
      if (!dbUser) return Response.json({ error: "User not found for Facebook" }, { status: 404 });
      const pageToken = getFacebookPageToken(dbUser, pageId!);
      const { uploadToFacebook } = await import("@/lib/social/facebook");
      const title = (body?.title as string) || job.input.title;
      const description = (body?.description as string) || job.input.description || "";
      const fb = await uploadToFacebook({
        videoPath,
        r2VideoKey,
        r2PublicUrl: r2Url,
        title,
        description,
        pageId: pageId!,
        pageAccessToken: pageToken,
        onProgress: () => {},
      });
      const newDest = { platform: "facebook", pageId, externalId: fb.videoId, videoUrl: fb.videoUrl, status: "delivered" as const };
      const updatedDests = [...(job.destinations || []).filter((d) => !(d.platform === "facebook" && d.pageId === pageId)), newDest];
      await updateVideoJob(job._id!, { destinations: updatedDests as never } as never);
      const updated = await getVideoJob(id);
      return Response.json({ ok: true, videoId: fb.videoId, videoUrl: fb.videoUrl, job: updated });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // persist failed attempt
    const failedDest = platform === "youtube"
      ? { platform, channelId, status: "failed" as const, error: msg }
      : { platform, pageId, status: "failed" as const, error: msg };
    try {
      const updatedDests = [...(job.destinations || []), failedDest];
      await updateVideoJob(job._id!, { destinations: updatedDests as never } as never);
    } catch {}
    return Response.json({ error: msg }, { status: 500 });
  }
}
