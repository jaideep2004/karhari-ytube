import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { findUserByEmail } from "@/lib/db/users";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  let user: Awaited<ReturnType<typeof findUserByEmail>> = null;
  try {
    user = await findUserByEmail(session.user.email);
  } catch {
    // DB not configured yet
  }

  const hasGoogle = !!user?.google?.sub;
  const hasFacebook = !!user?.facebook?.userId;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Welcome, {session.user.name || session.user.email} — choose audio, visualizer, and publish.
          </p>
        </div>
        <Link href="/dashboard/settings/connections" className="rounded-full border bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50">
          Settings → Connections
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Google / YouTube</div>
          <div className="mt-2 text-sm font-medium">{hasGoogle ? "Connected ✓" : "Not connected"}</div>
          <div className="mt-1 text-xs text-zinc-500">{hasGoogle ? "You can pick from your YouTube channels" : "Sign in with Google to enable"}</div>
          {!hasGoogle && (
            <a href="/api/auth/signin/google" className="mt-3 inline-block rounded-full bg-black px-4 py-1.5 text-xs font-semibold text-white">
              Connect Google
            </a>
          )}
        </div>
        <div className="rounded-xl border bg-white p-5">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Facebook / Pages</div>
          <div className="mt-2 text-sm font-medium">{hasFacebook ? "Connected ✓" : "Not connected"}</div>
          <div className="mt-1 text-xs text-zinc-500">{hasFacebook ? "You can pick from your Facebook pages" : "Connect Facebook to enable"}</div>
          {!hasFacebook && (
            <a href="/api/auth/signin/facebook" className="mt-3 inline-block rounded-full bg-[#1877F2] px-4 py-1.5 text-xs font-semibold text-white">
              Connect Facebook
            </a>
          )}
        </div>
        <div className="rounded-xl border bg-white p-5">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Your jobs</div>
          <div className="mt-2 text-sm font-medium">No jobs yet</div>
          <div className="mt-1 text-xs text-zinc-500">Jobs will appear here after you click Create & Upload on the homepage.</div>
          <Link href="/dashboard/jobs" className="mt-3 inline-block text-xs font-medium underline">
            View jobs →
          </Link>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border bg-white p-6">
        <h2 className="text-sm font-semibold">Quick upload</h2>
        <p className="mt-1 text-sm text-zinc-600">Use the homepage card to upload audio + thumbnail and publish.</p>
        <Link href="/" className="mt-4 inline-block rounded-full bg-black px-5 py-2 text-sm font-semibold text-white">
          Go to upload card →
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <div className="text-sm font-semibold">YouTube channels (API test)</div>
          <p className="mt-1 text-xs text-zinc-500">Calls /api/auth/youtube/channels — requires Google linked.</p>
          <a href="/api/auth/youtube/channels" target="_blank" className="mt-2 inline-block text-xs font-medium text-black underline">
            Test endpoint →
          </a>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <div className="text-sm font-semibold">Facebook pages (API test)</div>
          <p className="mt-1 text-xs text-zinc-500">Calls /api/auth/facebook/pages — requires Facebook linked.</p>
          <a href="/api/auth/facebook/pages" target="_blank" className="mt-2 inline-block text-xs font-medium text-black underline">
            Test endpoint →
          </a>
        </div>
      </div>
    </div>
  );
}
