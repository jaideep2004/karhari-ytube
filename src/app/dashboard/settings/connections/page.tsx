import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { findUserByEmail } from "@/lib/db/users";
import { signIn } from "@/auth";

export default async function ConnectionsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  let user = null;
  try {
    user = await findUserByEmail(session.user.email);
  } catch {}

  const hasGoogle = !!user?.google?.sub;
  const hasFacebook = !!user?.facebook?.userId;

  return (
    <div className="mx-auto max-w-[720px] px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold">Connections</h1>
      <p className="mt-1 text-sm text-zinc-600">Link your other provider to upload to both YouTube and Facebook.</p>

      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between rounded-xl border bg-white p-5">
          <div>
            <div className="text-sm font-semibold">Google / YouTube</div>
            <div className="text-xs text-zinc-500">{hasGoogle ? "Connected — you can choose your YouTube channels" : "Not connected"}</div>
          </div>
          {hasGoogle ? (
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Connected ✓</span>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard/settings/connections" });
              }}
            >
              <button type="submit" className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white">
                Connect Google
              </button>
            </form>
          )}
        </div>

        <div className="flex items-center justify-between rounded-xl border bg-white p-5">
          <div>
            <div className="text-sm font-semibold">Facebook / Pages</div>
            <div className="text-xs text-zinc-500">{hasFacebook ? "Connected — you can choose your Facebook Pages" : "Not connected"}</div>
          </div>
          {hasFacebook ? (
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">Connected ✓</span>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("facebook", { redirectTo: "/dashboard/settings/connections" });
              }}
            >
              <button type="submit" className="rounded-full bg-[#1877F2] px-4 py-2 text-xs font-semibold text-white">
                Connect Facebook
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg bg-zinc-50 p-4 text-xs leading-6 text-zinc-600">
        Tip: In the homepage upload card, YouTube and Facebook checkboxes are disabled until that provider is connected. Once both are connected you can tick both — we generate once and upload to both in parallel.
      </div>
    </div>
  );
}
