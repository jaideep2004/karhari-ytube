export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold">Contact</h1>
      <p className="mt-2 text-sm text-zinc-600">We respond within 1–2 business days. For AdSense verification, this page satisfies the contact requirement.</p>
      <div className="mt-6 rounded-xl border bg-white p-6 text-sm leading-7">
        <div><span className="font-medium">Email</span> — <a href="mailto:support@karhari-tube.example.com" className="underline">support@karhari-tube.example.com</a></div>
        <div><span className="font-medium">Privacy</span> — <a href="mailto:privacy@karhari-tube.example.com" className="underline">privacy@karhari-tube.example.com</a></div>
        <div><span className="font-medium">Address</span> — GDS Creatives, India (remote). Full postal address provided on request for AdSense verification.</div>
        <div className="mt-4 text-xs text-zinc-500">Tip: include your job ID (from /dashboard/jobs) when asking about a video.</div>
      </div>
      <form className="mt-6 space-y-4 rounded-xl border bg-white p-6" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label className="text-sm font-medium">Your email</label>
          <input placeholder="you@example.com" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium">Message</label>
          <textarea rows={4} placeholder="How can we help?" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white">Send (demo — use email above)</button>
      </form>
    </div>
  );
}
