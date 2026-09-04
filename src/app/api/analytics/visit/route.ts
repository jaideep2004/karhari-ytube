import { logEvent } from "@/lib/db/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = (body.path as string) || req.headers.get("referer") || "/";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const ua = req.headers.get("user-agent") || "";
    await logEvent({ type: "visit", path: String(path).slice(0, 200), ip: String(ip).slice(0, 45), ua: String(ua).slice(0, 200) });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: true });
  }
}

export async function GET() {
  return Response.json({ ok: true });
}
