import { auth } from "@/auth";
import { r2 } from "@/lib/storage/r2Provider";
import { ALLOWED_AUDIO_TYPES, MAX_AUDIO_BYTES, UPLOAD_DIR } from "@/lib/config";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import os from "os";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("audio") as File | null;
  if (!file) return Response.json({ error: "No audio file provided (field 'audio')" }, { status: 400 });

  if (file.size > MAX_AUDIO_BYTES) {
    return Response.json({ error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB > 200MB` }, { status: 400 });
  }
  if (file.type && !ALLOWED_AUDIO_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|flac|aac|m4a)$/i)) {
    return Response.json({ error: `Unsupported audio type: ${file.type || "unknown"}` }, { status: 400 });
  }

  const ext = path.extname(file.name) || ".mp3";
  const key = `audio/${uuidv4()}${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  // Try to get duration via music-metadata (optional)
  let duration: number | undefined;
  try {
    const { parseBuffer } = await import("music-metadata");
    const meta = await parseBuffer(buf, file.type || "audio/mpeg");
    duration = meta.format.duration || undefined;
  } catch {}

  // If R2 configured, upload to R2 — if this fails, the server log will show [upload] R2 failed with 403/AccessDenied. Fix by recreating R2 API token in Cloudflare → R2 → Manage API Tokens → Create Token → Object Read & Write → Include bucket
  if (r2.isConfigured) {
    const tmp = path.join(os.tmpdir(), `kt-audio-${uuidv4()}${ext}`);
    await fs.writeFile(tmp, buf);
    try {
      const { url } = await r2.uploadFile(tmp, key, file.type || "audio/mpeg");
      await fs.unlink(tmp).catch(() => {});
      return Response.json({ r2Key: key, r2Url: url, duration, fileSize: file.size, fileName: file.name });
    } catch (e) {
      await fs.unlink(tmp).catch(() => {});
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[upload] R2 failed for " + key + ", falling back to local:", msg, " — configure R2 in .env.local (R2_ENDPOINT/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET_NAME/R2_PUBLIC_DOMAIN)");
    }
  }

  // Fallback: store locally
  const localDir = path.join(UPLOAD_DIR, "audio");
  await fs.mkdir(localDir, { recursive: true });
  const localPath = path.join(localDir, path.basename(key));
  await fs.writeFile(localPath, buf);
  return Response.json({ r2Key: key, r2Url: "", localPath, warning: "R2 unavailable — stored locally. Fix R2 credentials to enable cloud storage. See server logs [upload] R2 failed.", duration, fileSize: file.size, fileName: file.name });
}
