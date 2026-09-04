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
  let user: Awaited<ReturnType<typeof findUserByEmail>> | null = null;
  try { user = await findUserByEmail(session.user.email); } catch {}
  const sessionRole = (session as unknown as { role?: string }).role;
  const isAdmin = sessionRole === "admin" || user?.role === "admin" || isAdminEmail(session.user.email);
  if (!isAdmin) return Response.json({ error: "Forbidden — admin only" }, { status: 403 });

  const { getHealthStatus } = await import("@/lib/admin/health");
  const health = await getHealthStatus();
  return Response.json(health);
}
