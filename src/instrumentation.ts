export async function register() {
  // Runs once when Next.js server starts (npm run dev / npm start)
  const tag = "[mongo]";
  const uri = process.env.MONGODB_URI || "";
  if (!uri) {
    console.warn(`${tag} MONGODB_URI not configured — DB disabled`);
    return;
  }
  // mask URI for log
  const masked = uri.replace(/:\/\/.*@/, "://***:***@").slice(0, 80);
  console.log(`${tag} checking ${masked} ...`);
  try {
    const { MongoClient } = await import("mongodb");
    const c = new MongoClient(uri, {
      serverSelectionTimeoutMS: 7000,
      connectTimeoutMS: 7000,
      socketTimeoutMS: 10000,
    } as never);
    await c.connect();
    await c.db().command({ ping: 1 });
    const dbName = c.db().databaseName || "(default)";
    console.log(`${tag} ✅ Connected — db=${dbName}`);
    await c.close();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // common causes: querySrv ETIMEOUT/ENOTFOUND = DNS, ECONNREFUSED = IP not whitelisted / cluster paused
    console.error(`${tag} ❌ Not connected: ${msg.slice(0, 400)}`);
    if (msg.includes("querySrv")) console.error(`${tag} → Fix: check internet/DNS (try 1.1.1.1), Atlas cluster Running, and Network Access IP whitelist`);
    if (msg.includes("auth")) console.error(`${tag} → Fix: check MONGODB_URI username/password`);
    // don't throw — let dev server stay up so /api/* can return 503 JSON instead of crashing
  }
}
