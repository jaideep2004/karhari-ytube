import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { findUserByEmail } from "@/lib/db/users";
import { listVideoJobs } from "@/lib/db/videoJobs";

export const dynamic = "force-dynamic";

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);

  let user = null;
  let data: { jobs: unknown[]; total: number; page: number; limit: number; totalPages: number } | null = null;
  let err: string | null = null;
  try {
    user = await findUserByEmail(session.user.email);
    if (!user?._id) err = "User not found";
    else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res: any = await listVideoJobs(user._id, { page, limit: 20 });
      data = res;
    }
  } catch (e) {
    err = e instanceof Error ? e.message : String(e);
    if (err.includes("MONGODB_URI")) err = "DB not configured — set MONGODB_URI and restart.";
  }

  const jobs = (data?.jobs || []) as unknown as Array<{
    _id: unknown;
    status: string;
    input: { title: string; artist: string; preset: string; color?: string };
    progress: { phase: string; pct: number };
    output?: { r2Url?: string; r2VideoKey?: string; duration?: number };
    createdAt: string | Date;
    error?: string | null;
  }>;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your uploads</h1>
        <Link href="/" className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">New upload</Link>
      </div>
      <p className="mt-1 text-sm text-zinc-600">{data ? `${data.total} job(s) — done videos can be uploaded to YouTube/Facebook from inside each job.` : "Video jobs appear here once generated (P3)."} {err && <span className="text-red-600">• {err}</span>}</p>

      {jobs.length === 0 ? (
        <div className="mt-6 rounded-xl border bg-white p-8 text-center text-sm text-zinc-500">No jobs yet — use the homepage card to create one.</div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs text-zinc-600">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Preset</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Deliver</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => {
                  const id = String(j._id);
                  return (
                    <tr key={id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="font-medium">{j.input.title}</div>
                        <div className="text-xs text-zinc-500">{j.input.artist} • {id.slice(0, 8)}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">{j.input.preset}/{j.input.color || "cyan"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${j.status === "done" ? "bg-green-100 text-green-800" : j.status === "failed" ? "bg-red-100 text-red-800" : "bg-zinc-100 text-zinc-700"}`}>{j.status}</span>
                        {j.error && <div className="max-w-[200px] truncate text-xs text-red-600">{j.error}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-200">
                          <div className="h-full bg-black" style={{ width: `${j.progress?.pct ?? 0}%` }} />
                        </div>
                        <div className="text-xs text-zinc-500">{j.progress?.phase} • {j.progress?.pct ?? 0}%</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{new Date(j.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {j.status === "done" ? <Link href={`/dashboard/jobs/${id}`} className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">Upload →</Link> : <Link href={`/dashboard/jobs/${id}`} className="text-xs font-medium underline">Open →</Link>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2 border-t p-4 text-xs">
              {page > 1 && <Link href={`/dashboard/jobs?page=${page - 1}`} className="underline">← Prev</Link>}
              <span>Page {data.page} of {data.totalPages}</span>
              {page < data.totalPages && <Link href={`/dashboard/jobs?page=${page + 1}`} className="underline">Next →</Link>}
            </div>
          )}
        </div>
      )}
      <Link href="/" className="mt-4 inline-block text-sm underline">Back to upload →</Link>
    </div>
  );
}
