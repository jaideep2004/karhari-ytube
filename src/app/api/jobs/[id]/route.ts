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
