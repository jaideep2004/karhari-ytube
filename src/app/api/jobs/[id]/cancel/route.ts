import { auth } from "@/auth";
import { findUserByEmail } from "@/lib/db/users";
import { getVideoJob, updateVideoJob } from "@/lib/db/videoJobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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
  if (String(job.userId) !== String(user?._id) && user?.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
  if (job.status === "done" || job.status === "failed") return Response.json({ job });

  await updateVideoJob(job._id!, { status: "failed", error: "Cancelled by user", progress: { phase: "failed", pct: 0, updatedAt: new Date() } } as never);
  const updated = await getVideoJob(id);
  return Response.json({ job: updated });
}
