import { listJobsDueForCleanup } from "@/lib/db/videoJobs";
import { cleanupJobMedia } from "@/lib/video/mediaCleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Daily cron: deletes R2 + local media for jobs delivered to ALL socials 24h+ ago.
// VPS crontab: 0 3 * * * curl -fsS "https://<domain>/api/cron/cleanup?secret=$CRON_SECRET" >> ~/kt-cleanup.log 2>&1
// Set CRON_SECRET in .env (any long random string). Manual run: open the URL once in browser.
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return false;
  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;
  return (req.headers.get("authorization") || "") === `Bearer ${secret}`;
}

async function run(req: Request) {
  if (!authorized(req)) return Response.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));

  let due;
  try {
    due = await listJobsDueForCleanup(limit);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: `DB error: ${msg}` }, { status: 500 });
  }

  const results = [];
  for (const j of due) {
    const id = String(j._id);
    try {
      results.push(await cleanupJobMedia(id));
    } catch (e) {
      results.push({ jobId: id, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return Response.json({ ok: true, checked: due.length, results });
}

export async function GET(req: Request) {
  return run(req);
}

export async function POST(req: Request) {
  return run(req);
}
