import { auth } from "@/auth";
import { findUserByEmail } from "@/lib/db/users";
import { createVideoJob, listVideoJobs } from "@/lib/db/videoJobs";
import { processVideoJob } from "@/lib/video/jobProcessor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Not authenticated" }, { status: 401 });
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);
  const status = url.searchParams.get("status") || undefined;

  let user;
  try {
    user = await findUserByEmail(session.user.email);
  } catch {
    return Response.json({ error: "DB not configured" }, { status: 500 });
  }
  if (!user?._id) return Response.json({ error: "User not found" }, { status: 404 });

  const data = await listVideoJobs(user._id, { page, limit, status });
  return Response.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });

  const { audioR2Key, artworkR2Key, title, artist, preset, color, visibility, scheduleAt, description, destinations, tags } = body as Record<string, unknown>;

  if (!audioR2Key || typeof audioR2Key !== "string") return Response.json({ error: "audioR2Key required" }, { status: 400 });
  if (!title || typeof title !== "string" || !title.trim()) return Response.json({ error: "title required" }, { status: 400 });

  // tags: normalize to string[] — clamp like YT Studio (≤30 chars each, ≤500 chars total, ≤15 tags)
  let normalizedTags: string[] | null = null;
  if (tags != null) {
    const raw: unknown[] = Array.isArray(tags) ? tags : typeof tags === "string" ? (tags as string).split(",") : [];
    const cleaned = raw
      .map((t) => String(t).trim().replace(/\s+/g, " ").slice(0, 30))
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 15);
    let total = 0;
    const limited: string[] = [];
    for (const t of cleaned) {
      const add = (limited.length ? 1 : 0) + t.length;
      if (total + add > 500) break;
      total += add;
      limited.push(t);
    }
    normalizedTags = limited.length ? limited : null;
  }

  const allowed = ["bars","circular","wave","pulse"] as const;
  const p = (typeof preset === "string" && (allowed as readonly string[]).includes(preset) ? preset : "bars") as typeof allowed[number];
  const c = typeof color === "string" ? color : "cyan";
  const v = visibility === "unlisted" || visibility === "private" ? visibility : "public";

  let user;
  try {
    user = await findUserByEmail(session.user.email);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: `DB error: ${msg}` }, { status: 500 });
  }
  if (!user?._id) return Response.json({ error: "User not found" }, { status: 404 });

  const job = await createVideoJob({
    userId: user._id,
    input: {
      audioR2Key: String(audioR2Key),
      artworkR2Key: artworkR2Key ? String(artworkR2Key) : null,
      title: String(title).trim().slice(0, 100),
      artist: artist ? String(artist).trim().slice(0, 100) : "",
      preset: p,
      color: c as never,
      visibility: v as never,
      scheduleAt: scheduleAt ? String(scheduleAt) : null,
      description: description ? String(description).slice(0, 5000) : null,
      tags: normalizedTags,
    },
  });

  // Persist destinations for P4 (if provided)
  if (Array.isArray(destinations) && destinations.length) {
    const { updateVideoJob } = await import("@/lib/db/videoJobs");
    await updateVideoJob(job._id!, { destinations: destinations as never });
  }

  // Fire and forget
  processVideoJob(String(job._id)).catch((e) => console.error("[jobs] process failed", e));

  return Response.json({ jobId: String(job._id), status: job.status }, { status: 201 });
}
