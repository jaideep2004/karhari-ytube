import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";

// Load .env.local manually if env not set (Next loads it, plain node doesn't)
for (const f of [".env.local", ".env"]) {
  try {
    const p = path.resolve(process.cwd(), f);
    if (!fs.existsSync(p)) continue;
    const txt = fs.readFileSync(p, "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const k = m[1].trim();
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
    if (process.env.MONGODB_URI) break;
  } catch {}
}

const uri = process.env.MONGODB_URI;
const email = (process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS?.split(",")[0] || "").trim().toLowerCase();
const plain = process.env.ADMIN_PASSWORD;
const hashEnv = process.env.ADMIN_PASSWORD_HASH;

if (!uri) { console.error("MONGODB_URI missing"); process.exit(1); }
if (!email) { console.error("ADMIN_EMAIL or ADMIN_EMAILS missing"); process.exit(1); }
if (!plain && !hashEnv) { console.error("Set ADMIN_PASSWORD or ADMIN_PASSWORD_HASH"); process.exit(1); }

let passwordHash = hashEnv;
if (!passwordHash && plain) {
  passwordHash = await bcrypt.hash(plain, 10);
  console.log("Hashed ADMIN_PASSWORD -> use this as ADMIN_PASSWORD_HASH for production:");
  console.log(passwordHash);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db();
const col = db.collection("users");
const existing = await col.findOne({ email });
const now = new Date();
if (existing) {
  await col.updateOne({ _id: existing._id }, { $set: { role: "admin", passwordHash, updatedAt: now } });
  console.log(`Updated admin ${email} (${existing._id}) -> role=admin`);
} else {
  const res = await col.insertOne({ email, name: "Admin", role: "admin", passwordHash, createdAt: now, updatedAt: now, lastLoginAt: now });
  console.log(`Created admin ${email} (${res.insertedId})`);
}
await client.close();
console.log("Done. Login at /admin/login");
