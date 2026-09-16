import fs from "fs/promises";
import path from "path";
import { r2 } from "@/lib/storage/r2Provider";
import { SOCIAL_VIDEO_DIR, UPLOAD_DIR } from "@/lib/config";
import { getVideoJob, updateVideoJob } from "@/lib/db/videoJobs";

export type CleanupResult = {
  jobId: string;
  skipped?: string;
  deletedR2: string[];
  deletedLocal: string[];
  r2Errors: string[];
};

/**
 * Delete a job's media (source audio + artwork + generated video, R2 and
 * local copies) — only when the job is done AND every social destination
 * shows delivered. The DB job record is always kept (audit/history).
 *
 * Safety: partial delivery (any failed destination) is never touched, so a
 * failed YouTube/Facebook upload can still be retried from Jobs → Deliver.
 */
export async function cleanupJobMedia(jobId: string): Promise<CleanupResult> {
  const job = await getVideoJob(jobId);
  if (!job || !job._id) throw new Error("Job not found");
  const res: CleanupResult = { jobId, deletedR2: [], deletedLocal: [], r2Errors: [] };

  const dests = (job.destinations || []) as { status?: string }[];
  const delivered = dests.filter((d) => d.status === "delivered").length;
  if (job.status !== "done" || dests.length === 0 || delivered !== dests.length) {
    res.skipped = `status=${job.status} delivered=${delivered}/${dests.length} — cleanup runs only after all socials delivered`;
    return res;
  }

  // ── R2 objects ──
  const r2Keys = [job.input?.audioR2Key, job.input?.artworkR2Key, job.output?.r2VideoKey].filter(
    Boolean
  ) as string[];
  if (r2.isConfigured) {
    for (const key of new Set(r2Keys)) {
      try {
        await r2.deleteFile(key);
        res.deletedR2.push(key);
      } catch (e) {
        res.r2Errors.push(`${key}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  // ── Local copies ──
  const localPaths: string[] = [
    // R2-fallback copies stored by /api/upload/* when R2 was down
    ...(job.input?.audioR2Key ? [path.join(UPLOAD_DIR, "audio", path.basename(job.input.audioR2Key))] : []),
    ...(job.input?.artworkR2Key
      ? [path.join(UPLOAD_DIR, "artwork", path.basename(job.input.artworkR2Key))]
      : []),
    // generated video
    path.join(SOCIAL_VIDEO_DIR, `${jobId}.mp4`),
  ];
  try {
    const files = await fs.readdir(SOCIAL_VIDEO_DIR);
    for (const f of files) {
      if (f.startsWith(`deliver_${jobId}_`) && f.endsWith(".mp4")) {
        localPaths.push(path.join(SOCIAL_VIDEO_DIR, f));
      }
    }
  } catch {}
  for (const p of localPaths) {
    try {
      await fs.unlink(p);
      res.deletedLocal.push(p);
    } catch {
      // already gone — fine
    }
  }

  await updateVideoJob(job._id, { mediaCleaned: true });
  console.log(
    `[cleanup] job ${jobId}: R2 -${res.deletedR2.length}, local -${res.deletedLocal.length}` +
      (res.r2Errors.length ? `, R2 errors: ${res.r2Errors.join("; ")}` : "")
  );
  return res;
}
