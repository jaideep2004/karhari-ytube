"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function JobDeleteButton({ jobId, title, status }: { jobId: string; title: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const running = status !== "done" && status !== "failed";

  const onDelete = async () => {
    if (
      !confirm(
        `Delete "${title}"?` +
          (running
            ? " This will STOP the running job and delete its files (R2 + local)."
            : " This deletes its files (R2 + local) and removes it from the list.")
      )
    )
      return;
    setBusy(true);
    try {
      const r = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Delete failed");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      title={running ? "Stop job and delete files" : "Delete job and files"}
      className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      {busy ? "Deleting…" : running ? "Stop + Delete" : "Delete"}
    </button>
  );
}
