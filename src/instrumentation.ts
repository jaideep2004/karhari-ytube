export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { recoverStaleJobs } = await import("./lib/video/jobRecovery");
      await recoverStaleJobs();
    } catch (e) {
      console.warn(
        "[jobs] stale-job recovery skipped:",
        e instanceof Error ? e.message : String(e)
      );
    }
  }
}
