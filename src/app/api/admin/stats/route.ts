import { auth } from "@/auth";
import { findUserByEmail } from "@/lib/db/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (list.length === 0) return false;
  return list.includes(email.toLowerCase());
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Not authenticated" }, { status: 401 });
  const user = await findUserByEmail(session.user.email).catch(() => null);
  const sessionRole = (session as unknown as { role?: string }).role;
  const isAdmin = sessionRole === "admin" || user?.role === "admin" || isAdminEmail(session.user.email);
  if (!isAdmin) return Response.json({ error: "Forbidden — admin only" }, { status: 403 });

  try {
    const { getStats } = await import("@/lib/db/analytics");
    const stats = await getStats();
    return Response.json(stats);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("MONGODB_URI")) return Response.json({ error: "DB not configured", visits: 0, users: 0, jobs: 0, uploadsByUser: [], recentUsers: [], recentJobs: [] });
    return Response.json({ error: msg }, { status: 500 });
  }
}
