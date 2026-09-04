import Link from "next/link";
import { auth } from "@/auth";

function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (list.length > 0) return list.includes(email.toLowerCase());
  return false;
}

export async function Header() {
  const session = await auth();
  const user = session?.user as { name?: string; email?: string; image?: string } | undefined;

  if (!user?.email) {
    return null;
  }

  // admin check: session role (credentials) > DB role=admin > ADMIN_EMAILS allowlist
  let isAdmin = (session as unknown as { role?: string }).role === "admin" || isAdminEmail(user.email);
  if (!isAdmin) {
    try {
      const { findUserByEmail } = await import("@/lib/db/users");
      const dbUser = await findUserByEmail(user.email);
      if (dbUser?.role === "admin") isAdmin = true;
    } catch {}
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white shadow-xs">
      <div className="mx-auto flex h-14 max-w-[1140px] items-center justify-between px-4 sm:px-6 xl:px-12">
        <Link href="/" className="flex items-center gap-2">
          <img
            src="/images/karhari-media-b1.png"
            alt="Karhari Media Logo"
            className="h-8 w-auto object-contain"
          />
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="font-medium text-zinc-700 hover:text-black">
            Dashboard
          </Link>
          <Link href="/dashboard/jobs" className="text-zinc-600 hover:text-black">
            Jobs
          </Link>
          <Link href="/dashboard/settings/connections" className="text-zinc-600 hover:text-black">
            Connections
          </Link>
          {isAdmin && (
            <Link href="/admin" className="rounded-full bg-[#212529] px-3 py-1 text-xs font-semibold text-white hover:bg-black">
              Admin
            </Link>
          )}
          <div className="h-4 w-px bg-zinc-200" />
          <div className="flex items-center gap-2">
            {user.image ? (
              <img src={user.image} alt={user.name || "user"} className="h-6 w-6 rounded-full" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium">
                {(user.name || user.email || "U").slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="hidden text-xs font-medium text-zinc-700 sm:inline">
              {user.name || user.email}
            </span>
            <Link
              href="/api/auth/signout"
              className="ml-2 text-xs text-zinc-500 hover:text-red-600"
            >
              Sign out
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}