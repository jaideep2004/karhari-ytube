import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const recent = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const arr = (recent.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  arr.push(now);
  recent.set(ip, arr);
  return arr.length > RATE_LIMIT_MAX;
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anon";
    if (rateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests — try again in a minute" }, { status: 429 });
    }

    const body = (await req.json().catch(() => null)) as
      | { name?: string; email?: string; phone?: string; subject?: string; message?: string }
      | null;
    if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    const name = String(body.name || "").trim().slice(0, 100);
    const email = String(body.email || "").trim().slice(0, 200);
    const phone = String(body.phone || "").trim().slice(0, 30);
    const subject = String(body.subject || "").trim().slice(0, 200);
    const message = String(body.message || "").trim().slice(0, 5000);

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!isEmail(email)) return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    if (!message || message.length < 10)
      return NextResponse.json({ error: "Message must be at least 10 characters" }, { status: 400 });

    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const contactTo = process.env.CONTACT_TO || "support@karharimedia.com";
    const fromName = process.env.SMTP_FROM_NAME || "Karhari Tube";

    // If SMTP isn't configured, still accept and log so the form UX works during dev.
    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn("[contact] SMTP not configured — message logged only", {
        name, email, phone, subject, message,
      });
      return NextResponse.json({ ok: true, sent: false, note: "SMTP not configured" });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 465),
      secure: (process.env.SMTP_SECURE || "true") === "true",
      auth: { user: smtpUser, pass: smtpPass },
    });

    const text = [
      `Name: ${name}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      subject ? `Subject: ${subject}` : null,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    const html = `
      <div style="font-family:Inter,system-ui,sans-serif;font-size:14px;color:#212529;line-height:1.6">
        <h2 style="margin:0 0 12px">New contact form message</h2>
        <table cellpadding="6" style="border-collapse:collapse">
          <tr><td><b>Name</b></td><td>${esc(name)}</td></tr>
          <tr><td><b>Email</b></td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
          ${phone ? `<tr><td><b>Phone</b></td><td>${esc(phone)}</td></tr>` : ""}
          ${subject ? `<tr><td><b>Subject</b></td><td>${esc(subject)}</td></tr>` : ""}
        </table>
        <h3 style="margin:18px 0 6px">Message</h3>
        <div style="white-space:pre-wrap;background:#f8f9fa;padding:12px;border-radius:8px;border:1px solid #e5e7eb">${esc(message)}</div>
        <p style="color:#6b7280;font-size:12px;margin-top:16px">Sent from the karhari-tube contact form.</p>
      </div>`;

    await transporter.sendMail({
      from: `${fromName} <${smtpUser}>`,
      to: contactTo,
      replyTo: `${name} <${email}>`,
      subject: subject ? `[Karhari Tube] ${subject}` : `[Karhari Tube] New message from ${name}`,
      text,
      html,
    });

    return NextResponse.json({ ok: true, sent: true });
  } catch (e) {
    console.error("[contact] error", e);
    return NextResponse.json({ error: "Failed to send — please email us directly" }, { status: 500 });
  }
}
