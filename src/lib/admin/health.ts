import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

type Check = { ok: boolean; label: string; value?: string; hint?: string; error?: string };

function mask(s: string): string {
  if (!s) return "";
  if (s.length <= 8) return s.slice(0, 2) + "***" + s.slice(-2);
  return s.slice(0, 4) + "***" + s.slice(-4);
}

function envPresent(key: string): Check {
  const v = process.env[key] || "";
  const isPlaceholder = !v || v.includes("[REDACTED]") || v.includes("placeholder") || v.toLowerCase().includes("your_") || v === "changeme";
  if (isPlaceholder) return { ok: false, label: key, value: "not set", hint: `Set ${key} in .env.local` };
  return { ok: true, label: key, value: mask(v) };
}

async function checkR2(): Promise<{ configured: boolean; checks: Check[]; live?: Check }> {
  const ep = process.env.R2_ENDPOINT || "";
  const id = process.env.R2_ACCESS_KEY_ID || "";
  const sec = process.env.R2_SECRET_ACCESS_KEY || "";
  const bucket = process.env.R2_BUCKET_NAME || "";
  const pub = process.env.R2_PUBLIC_DOMAIN || "";

  const checks: Check[] = [
    envPresent("R2_ENDPOINT"),
    envPresent("R2_ACCESS_KEY_ID"),
    envPresent("R2_SECRET_ACCESS_KEY"),
    envPresent("R2_BUCKET_NAME"),
    { ok: !!pub, label: "R2_PUBLIC_DOMAIN", value: pub ? pub.replace(/^https?:\/\//, "") : "not set", hint: pub ? undefined : "Needed for Facebook file_url and public video URL — set to pub-xxx.r2.dev (without https://)" },
  ];

  const isConfigured = !!(ep && id && sec && bucket);
  let live: Check | undefined;
  if (!isConfigured) {
    live = { ok: false, label: "R2 live", value: "skipped", hint: "Set all 4 R2 vars to test" };
  } else {
    // Cheap live check: HeadBucket with 5s timeout
    const client = new S3Client({
      region: "auto",
      endpoint: ep,
      credentials: { accessKeyId: id, secretAccessKey: sec },
      requestHandler: { connectionTimeout: 5000, requestTimeout: 5000 },
    });
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket }), { abortSignal: ctrl.signal } as unknown as { abortSignal: AbortSignal });
      clearTimeout(t);
      live = { ok: true, label: "R2 live", value: `bucket "${bucket}" reachable`, hint: `HeadBucket OK` };
    } catch (e) {
      clearTimeout(t);
      const msg = e instanceof Error ? e.message : String(e);
      const is403 = msg.includes("403") || msg.includes("AccessDenied");
      const is404 = msg.includes("404") || msg.includes("NoSuchBucket");
      const hint = is403 ? "Token not scoped for this bucket — recreate R2 API Token with Object Read & Write Include this bucket" : is404 ? "Bucket not found — check R2_BUCKET_NAME" : "Check R2_ENDPOINT / credentials";
      live = { ok: false, label: "R2 live", value: msg.slice(0, 180), error: msg, hint };
    }
  }
  return { configured: isConfigured, checks, live };
}

function checkGoogle(): { checks: Check[]; ok: boolean } {
  const id = process.env.GOOGLE_CLIENT_ID || "";
  const sec = process.env.GOOGLE_CLIENT_SECRET || "";
  const checks: Check[] = [
    envPresent("GOOGLE_CLIENT_ID"),
    envPresent("GOOGLE_CLIENT_SECRET"),
  ];
  // extra format hint
  if (id && !id.endsWith(".apps.googleusercontent.com")) {
    checks.push({ ok: false, label: "GOOGLE_CLIENT_ID format", value: "should end with .apps.googleusercontent.com", hint: "Copy full Client ID from Google Cloud Console → Credentials" });
  } else if (id) {
    checks.push({ ok: true, label: "GOOGLE_CLIENT_ID format", value: "looks valid" });
  }
  if (sec && sec.length < 20) {
    checks.push({ ok: false, label: "GOOGLE_CLIENT_SECRET", value: "too short", hint: "Check secret copied correctly" });
  }
  const ok = checks.every((c) => c.ok);
  return { checks, ok };
}

function checkFacebook(): { checks: Check[]; ok: boolean } {
  const id = process.env.FACEBOOK_CLIENT_ID || "";
  const sec = process.env.FACEBOOK_CLIENT_SECRET || "";
  const checks: Check[] = [
    envPresent("FACEBOOK_CLIENT_ID"),
    envPresent("FACEBOOK_CLIENT_SECRET"),
  ];
  if (id && !/^\d{10,}$/.test(id)) {
    checks.push({ ok: false, label: "FACEBOOK_CLIENT_ID format", value: "should be numeric App ID", hint: "From developers.facebook.com → Settings → Basic → App ID" });
  } else if (id) {
    checks.push({ ok: true, label: "FACEBOOK_CLIENT_ID format", value: "looks valid" });
  }
  const ok = checks.every((c) => c.ok);
  return { checks, ok };
}

function checkCore(): Check[] {
  return [
    envPresent("MONGODB_URI"),
    envPresent("NEXTAUTH_SECRET"),
    envPresent("TOKEN_ENCRYPTION_KEY"),
    { ok: !!process.env.NEXTAUTH_URL, label: "NEXTAUTH_URL", value: process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "not set (uses request host)"), hint: !process.env.NEXTAUTH_URL ? "Optional on Vercel; set to https://yourdomain.com in production" : undefined },
    { ok: !!process.env.ADMIN_EMAIL || !!process.env.ADMIN_EMAILS, label: "ADMIN_EMAIL", value: process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || "not set", hint: !process.env.ADMIN_EMAIL && !process.env.ADMIN_EMAILS ? "Set to your email to allow /admin" : undefined },
  ];
}

export async function getHealthStatus() {
  const [r2, google, facebook] = await Promise.all([
    checkR2(),
    Promise.resolve(checkGoogle()),
    Promise.resolve(checkFacebook()),
  ]);
  const core = checkCore();
  const coreOk = core.every((c) => c.ok || c.label === "NEXTAUTH_URL" || c.label === "ADMIN_EMAIL");
  return {
    at: new Date().toISOString(),
    r2: { ok: !!r2.live?.ok, configured: r2.configured, checks: r2.checks, live: r2.live },
    google: { ok: google.ok, checks: google.checks },
    facebook: { ok: facebook.ok, checks: facebook.checks },
    core: { ok: coreOk, checks: core },
  };
}

export type HealthStatus = Awaited<ReturnType<typeof getHealthStatus>>;
