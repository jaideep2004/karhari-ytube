import { auth } from "@/auth";
import { r2 } from "@/lib/storage/r2Provider";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, UPLOAD_DIR } from "@/lib/config";
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
  const file = form.get("artwork") as File | null;
  if (!file) return Response.json({ error: "No artwork file provided (field 'artwork')" }, { status: 400 });

  if (file.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: `Image too large: ${(file.size / 1024 / 1024).toFixed(1)}MB > 15MB` }, { status: 400 });
  }
  if (file.type && !ALLOWED_IMAGE_TYPES.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
    return Response.json({ error: `Unsupported image type: ${file.type}` }, { status: 400 });
  }

  const ext = path.extname(file.name) || ".jpg";
  const key = `artwork/${uuidv4()}${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  if (r2.isConfigured) {
    const tmp = path.join(os.tmpdir(), `kt-art-${uuidv4()}${ext}`);
    await fs.writeFile(tmp, buf);
    try {
      const { url } = await r2.uploadFile(tmp, key, file.type || "image/jpeg");
      await fs.unlink(tmp).catch(() => {});
      return Response.json({ r2Key: key, r2Url: url, fileSize: file.size, fileName: file.name });
    } catch (e) {
      await fs.unlink(tmp).catch(() => {});
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[upload] R2 failed for " + key + ", falling back to local:", msg, " — configure R2 in .env.local (R2_ENDPOINT/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET_NAME/R2_PUBLIC_DOMAIN)");
    }
  }

  const localDir = path.join(UPLOAD_DIR, "artwork");
  await fs.mkdir(localDir, { recursive: true });
  const localPath = path.join(localDir, path.basename(key));
  await fs.writeFile(localPath, buf);
  return Response.json({ r2Key: key, r2Url: "", localPath, warning: "R2 unavailable — stored locally. Fix R2 credentials in .env.local", fileSize: file.size, fileName: file.name });
}
