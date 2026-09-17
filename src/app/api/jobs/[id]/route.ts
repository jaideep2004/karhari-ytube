import { auth } from "@/auth";
import { findUserByEmail } from "@/lib/db/users";
import { getVideoJob } from "@/lib/db/videoJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Not authenticated" }, { status: 401 });

  let user;
  try {
    user = await findUserByEmail(session.user.email);
  } catch {
    return Response.json({ error: "DB not configured" }, { status: 500 });
  }
  const job = await getVideoJob(id);
  if (!job) return Response.json({ error: "Not found" }, { status: 404 });
  // ownership check (admin bypass later)
  if (String(job.userId) !== String(user?._id) && user?.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return Response.json({ job });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Not authenticated" }, { status: 401 });

  let user;
  try {
    user = await findUserByEmail(session.user.email);
  } catch {
    return Response.json({ error: "DB not configured" }, { status: 500 });
  }
  const job = await getVideoJob(id);
  if (!job) return Response.json({ error: "Not found" }, { status: 404 });
  if (String(job.userId) !== String(user?._id) && user?.role !== "admin") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // 1) Stop a live worker if this process owns it (ffmpeg SIGKILL + abort
  // chunk loops). No-op when already finished or after a pm2 restart.
  // The orphaned worker's catch then no-ops against the deleted doc.
  const { abortRunningJob } = await import("@/lib/video/jobProcessor");
  const stopped = abortRunningJob(id);

  // 2) Delete media (R2 audio/artwork/video + local copies) — best effort.
  const { deleteJobMedia } = await import("@/lib/video/mediaCleanup");
  const media = await deleteJobMedia(id).catch((e) => ({
    deletedR2: [] as string[],
    deletedLocal: [] as string[],
    r2Errors: [e instanceof Error ? e.message : String(e)],
  }));

  // 3) Delete the record.
  const { deleteVideoJob } = await import("@/lib/db/videoJobs");
  await deleteVideoJob(id);

  console.log(`[jobs] deleted ${id} (live worker stopped: ${stopped})`);
  return Response.json({ ok: true, stopped, media });
}
