"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn("admin-credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setErr("Invalid admin email or password. Check ADMIN_EMAIL / ADMIN_PASSWORD in .env.local and restart.");
      return;
    }
    if (res?.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setErr(res?.error || "Login failed");
    }
  }

  return (
    <div className="mx-auto max-w-[420px] px-4 py-16">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold">Admin login</h1>
        <p className="mt-1 text-sm text-zinc-600">Seeded from env vars — no Google required.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-700">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@karharimedia.com" className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-black" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-700">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-black" />
          </div>
          {err && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          <button type="submit" disabled={loading} className="w-full rounded-full bg-[#212529] py-3 text-sm font-semibold text-white hover:bg-black disabled:opacity-60">
            {loading ? "Signing in…" : "Sign in as admin"}
          </button>
        </form>
        <div className="mt-4 text-center text-xs text-zinc-500">
          Uses <code className="rounded bg-zinc-100 px-1">ADMIN_EMAIL</code> / <code className="rounded bg-zinc-100 px-1">ADMIN_PASSWORD</code> or <code className="rounded bg-zinc-100 px-1">ADMIN_PASSWORD_HASH</code>. Seeded to <code className="rounded bg-zinc-100 px-1">users.role=admin</code> on first login.
        </div>
        <Link href="/" className="mt-6 block text-center text-sm underline">Back home →</Link>
      </div>
      <div className="mt-4 rounded-xl border border-dashed bg-zinc-50 p-4 text-xs text-zinc-600">
        <div className="font-semibold">Set in .env.local then restart:</div>
        <pre className="mt-2 overflow-auto rounded bg-white p-3 text-[11px] leading-5">ADMIN_EMAIL=admin@karharimedia.com{"\n"}ADMIN_PASSWORD=your-strong-password{"\n"}# or pre-hashed (bcrypt):{"\n"}# ADMIN_PASSWORD_HASH=$2b$10$....</pre>
      </div>
    </div>
  );
}
