import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { findUserByEmail } from "@/lib/db/users";
import Link from "next/link";
import { getHealthStatus } from "@/lib/admin/health";
import { AdminHealth } from "@/components/AdminHealth";

export const dynamic = "force-dynamic";

function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (list.length > 0) return list.includes(email.toLowerCase());
  return false;
}

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/admin/login");
  let user = null;
  try {
    user = await findUserByEmail(session.user.email);
  } catch {}
  const sessionRole = (session as unknown as { role?: string }).role;
  const isAdmin = sessionRole === "admin" || user?.role === "admin" || isAdminEmail(session.user.email);
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-10">
        <h1 className="text-xl font-semibold">Admin — forbidden</h1>
        <p className="mt-2 text-sm text-zinc-600">Your account ({session.user.email}) is not an admin. Not an admin. Login at /admin/login with ADMIN_EMAIL / ADMIN_PASSWORD from .env.local (or set role=admin in DB / ADMIN_EMAILS for Google).</p>
        <Link href="/" className="mt-4 inline-block text-sm underline">Back home →</Link>
      </div>
    );
  }

  let stats: { visits: number; users: number; jobs: number; uploadsByUser: unknown[]; recentUsers: unknown[]; recentJobs: unknown[]; error?: string } | null = null;
  let err: string | null = null;
  try {
    const { getStats } = await import("@/lib/db/analytics");
    stats = await getStats();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("MONGODB_URI")) err = "DB not configured — set MONGODB_URI";
    else err = msg;
  }

  const uploads = (stats?.uploadsByUser || []) as Array<{ _id: unknown; count: number; user: { email?: string; name?: string }[] }>;
  const recentUsers = (stats?.recentUsers || []) as Array<{ _id: unknown; email: string; name?: string; createdAt: string; google?: { sub?: string }; facebook?: { userId?: string } }>;
  const recentJobs = (stats?.recentJobs || []) as Array<{ _id: unknown; status: string; input: { title: string }; createdAt: string; userId: unknown }>;

  let health: Awaited<ReturnType<typeof getHealthStatus>> | null = null;
  try { health = await getHealthStatus(); } catch {}

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold">Admin — overview</h1>
      <p className="mt-1 text-sm text-zinc-600">Visits • Users • Uploads (P6)</p>
      {err && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6">
          <div className="text-xs font-semibold tracking-widest text-zinc-500">VISITS</div>
          <div className="mt-1 text-2xl font-semibold">{stats?.visits ?? "—"}</div>
          <div className="text-xs text-zinc-500">analyticsEvents type=visit</div>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <div className="text-xs font-semibold tracking-widest text-zinc-500">USERS</div>
          <div className="mt-1 text-2xl font-semibold">{stats?.users ?? "—"}</div>
          <div className="text-xs text-zinc-500">users collection</div>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <div className="text-xs font-semibold tracking-widest text-zinc-500">VIDEOS / JOBS</div>
          <div className="mt-1 text-2xl font-semibold">{stats?.jobs ?? "—"}</div>
          <div className="text-xs text-zinc-500">videoJobs collection</div>
        </div>
      </div>

      {health ? (
        <div className="mt-8">
          <AdminHealth initial={health} />
        </div>
      ) : (
        <div className="mt-8 rounded-xl border bg-amber-50 p-4 text-sm text-amber-800">Health check unavailable — env not loaded</div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-sm font-semibold">Uploads by user (top 20)</h2>
          {uploads.length === 0 ? (
            <div className="mt-3 text-sm text-zinc-500">No uploads yet.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {uploads.map((u, i) => {
                const email = (u.user?.[0]?.email as string) || String(u._id).slice(0, 8);
                const name = (u.user?.[0]?.name as string) || "";
                return (
                  <div key={String(u._id)} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <span>#{i + 1} {email} {name && <span className="text-zinc-500">• {name}</span>}</span>
                    <span className="font-semibold">{u.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-sm font-semibold">Recent users (10)</h2>
          {recentUsers.length === 0 ? (
            <div className="mt-3 text-sm text-zinc-500">No users.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {recentUsers.map((u) => (
                <div key={String(u._id)} className="rounded-lg border px-3 py-2 text-xs">
                  <div className="font-medium">{u.email} {u.name ? `• ${u.name}` : ""}</div>
                  <div className="text-zinc-500">{u.google?.sub ? "Google ✓" : ""} {u.facebook?.userId ? "Facebook ✓" : ""} • {new Date(u.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-white p-6">
        <h2 className="text-sm font-semibold">Recent jobs (10)</h2>
        {recentJobs.length === 0 ? (
          <div className="mt-3 text-sm text-zinc-500">No jobs.</div>
        ) : (
          <div className="mt-3 space-y-2">
            {recentJobs.map((j) => (
              <div key={String(j._id)} className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
                <span className="font-medium">{j.input?.title || String(j._id).slice(0, 8)} • {j.status}</span>
                <span className="text-zinc-500">{new Date(j.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 rounded-xl bg-zinc-50 p-4 text-xs leading-6 text-zinc-600">
        <div className="font-medium">How visits are counted</div>
        <div>Each homepage view POSTs to /api/analytics/visit (client). For server-rendered visits you can also call logEvent from middleware. CheckAds.txt at <Link href="/ads.txt" className="underline">/ads.txt</Link> must be google.com, pub-XXXXXXXXXXXX. Policy pages at /privacy, /terms, /contact, /about are required for AdSense approval.</div>
      </div>
    </div>
  );
}
