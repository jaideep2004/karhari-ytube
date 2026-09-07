"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "sending" | "ok" | "error";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg(null);
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `Failed (${r.status})`);
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Failed to send");
    }
  }

  if (status === "ok") {
    return (
      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
        <div className="font-medium">Thanks — your message is on its way.</div>
        <div className="mt-1">
          We&apos;ll reply to <span className="font-medium">{email}</span> within 1–2 business days.
        </div>
      </div>
    );
  }

  return (
    <form className="mt-6 space-y-4 rounded-xl border bg-white p-6" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium" htmlFor="name">
            Name <span className="text-red-600">*</span>
          </label>
          <input
            id="name"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="email">
            Email <span className="text-red-600">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            maxLength={200}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium" htmlFor="phone">
            Phone <span className="text-xs text-zinc-500">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            maxLength={30}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98xxxxxxxx"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="subject">
            Subject <span className="text-xs text-zinc-500">(optional)</span>
          </label>
          <input
            id="subject"
            maxLength={200}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Issue with my video job"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium" htmlFor="message">
          Message <span className="text-red-600">*</span>
        </label>
        <textarea
          id="message"
          rows={5}
          required
          minLength={10}
          maxLength={5000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help?"
          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
        />
        <div className="mt-1 text-right text-[11px] text-zinc-500">{message.length}/5000</div>
      </div>

      {status === "error" && errorMsg && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{errorMsg}</div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-zinc-500">
          Or email <a href="mailto:support@karharimedia.com" className="underline">support@karharimedia.com</a>
        </div>
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
