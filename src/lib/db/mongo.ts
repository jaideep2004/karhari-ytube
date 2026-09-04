import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;
// throttle across Next.js workers (Turbopack uses 11 workers)
function getLastLogAt(): number { return (globalThis as unknown as { __mongoLastLogAt?: number }).__mongoLastLogAt || 0; }
function setLastLogAt(v: number) { (globalThis as unknown as { __mongoLastLogAt?: number }).__mongoLastLogAt = v; }
function getLastSuccess(): boolean { return !!(globalThis as unknown as { __mongoLastSuccess?: boolean }).__mongoLastSuccess; }
function setLastSuccess(v: boolean) { (globalThis as unknown as { __mongoLastSuccess?: boolean }).__mongoLastSuccess = v; }

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not configured');
  if (db) {
    try {
      // quick ping to ensure still connected; if fails we reconnect
      await db.command({ ping: 1 });
      return db;
    } catch {
      db = null;
      try { await client?.close(); } catch {}
      client = null;
    }
  }
  if (client && !db) {
    try { await client.close(); } catch {}
    client = null;
  }
  // SRV DNS (querySrv ECONNREFUSED) is flaky on some networks/IPv6 — use short timeouts + retry
  const t0 = Date.now();
  const masked = uri.replace(/:\/\/.*@/, "://***:***@").slice(0, 70);
  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 7000,
    connectTimeoutMS: 7000,
    socketTimeoutMS: 15000,
    retryWrites: true,
  } as never);
  try {
    await client.connect();
    db = client.db();
    const ms = Date.now() - t0;
    // log success once per process (avoid spam on every request)
    if (!getLastSuccess()) {
      console.log(`[mongo] ✅ Connected ${masked} db=${db.databaseName || "(default)"} in ${ms}ms`);
      setLastSuccess(true);
    }
    return db;
  } catch (e) {
    const ms = Date.now() - t0;
    const msg = e instanceof Error ? e.message : String(e);
    // throttle error spam — log once per 30s across workers
    const now = Date.now();
    if (now - getLastLogAt() > 30000) {
      console.error(`[mongo] ❌ Connect failed in ${ms}ms: ${msg.slice(0, 300)} (${masked})`);
      if (msg.includes("querySrv")) console.error(`[mongo] → DNS SRV lookup failed. Try: nslookup _mongodb._tcp.cluster0.qyvy9n1.mongodb.net 1.1.1.1 | Atlas Running? | Network Access IP whitelist`);
      setLastLogAt(now);
    }
    try { await client.close(); } catch {}
    client = null;
    throw e;
  }
}

export async function getMongoClient(): Promise<MongoClient> {
  await getDb();
  return client!;
}
