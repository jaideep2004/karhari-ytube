import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { findUserByEmail } from "@/lib/db/users";
import { getVideoJob } from "@/lib/db/videoJobs";
import { JobLive } from "@/components/JobLive";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  let user = null;
  let job: Awaited<ReturnType<typeof getVideoJob>> = null;
  try {
    user = await findUserByEmail(session.user.email);
    job = await getVideoJob(id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("MONGODB_URI")) {
      return (
        <div className="mx-auto max-w-[800px] px-4 py-8">
          <div className="rounded-xl border bg-red-50 p-6 text-sm text-red-700">DB not configured — set MONGODB_URI</div>
          <Link href="/dashboard/jobs" className="mt-4 inline-block text-sm underline">Back to jobs</Link>
        </div>
      );
    }
    throw e;
  }
  if (!job) notFound();
  if (String(job.userId) !== String(user?._id) && user?.role !== "admin") {
    return <div className="mx-auto max-w-[800px] px-4 py-8 text-sm">Forbidden</div>;
  }

  const initial = {
    _id: String(job._id),
    status: job.status,
    input: job.input,
    output: job.output as never,
    progress: job.progress,
    error: job.error || null,
    createdAt: job.createdAt instanceof Date ? job.createdAt.toISOString() : String(job.createdAt),
    destinations: job.destinations,
  };

  return (
    <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6">
      <Link href="/dashboard/jobs" className="text-sm underline">← All jobs</Link>
      <h1 className="mt-2 text-xl font-semibold">Job {id.slice(0, 8)}…</h1>
      <p className="text-sm text-zinc-600">{job.input.title} • {job.status}</p>
      <div className="mt-6">
        <JobLive jobId={id} initialJob={initial as never} />
      </div>
      <div className="mt-6 flex gap-3 text-xs">
        {job.status !== "done" && job.status !== "failed" && (
          <form
            action={async () => {
              "use server";
              // cancel via API not server action here — link to manual fetch
            }}
          >
            <button
              formAction={async () => {
                "use server";
                const { updateVideoJob } = await import("@/lib/db/videoJobs");
                if (job && job._id) await updateVideoJob(job._id, { status: "failed", error: "Cancelled", progress: { phase: "failed", pct: 0, updatedAt: new Date() } } as never);
                redirect(`/dashboard/jobs/${id}`);
              }}
              className="rounded-full border px-4 py-2 font-medium hover:bg-zinc-50"
            >
              Cancel job
            </button>
          </form>
        )}
        <Link href="/" className="rounded-full bg-black px-4 py-2 font-medium text-white">New upload</Link>
      </div>
    </div>
  );
}
