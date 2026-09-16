import { getDb } from "@/lib/db/mongo";

const ACTIVE_STATUSES = ["queued", "downloading", "generating", "uploading"];

/**
 * Jobs are processed fire-and-forget inside the Next.js process. If pm2
 * restarts (deploy, crash, OOM) mid-job, the worker dies with the process and
 * the job would sit at its last % forever. Run once at server boot: anything
 * still "active" but untouched for staleMinutes can have no live worker, so
 * mark it failed with a clear message instead of a frozen progress bar.
 *
 * Safe under a single pm2 instance: at boot no worker exists yet, and healthy
 * jobs touch `updatedAt` every few seconds via setJobProgress.
 */
export async function recoverStaleJobs(staleMinutes = 10): Promise<number> {
  const db = await getDb();
  const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000);
  const res = await db.collection("videoJobs").updateMany(
    { status: { $in: ACTIVE_STATUSES }, updatedAt: { $lt: cutoff } },
    {
      $set: {
        status: "failed",
        error: "Server restarted during processing — please create the job again",
        progress: { phase: "failed", pct: 0, updatedAt: new Date() },
        updatedAt: new Date(),
      },
    }
  );
  if (res.modifiedCount > 0) {
    console.log(`[jobs] marked ${res.modifiedCount} orphaned job(s) as failed after restart`);
  }
  return res.modifiedCount;
}
