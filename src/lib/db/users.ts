import { ObjectId } from "mongodb";
import { getDb } from "./mongo";
import { encryptTokenMap, decryptTokenMap, decryptToken } from "../auth/tokenVault";

export type UserDoc = {
  _id?: ObjectId;
  email: string;
  name?: string;
  image?: string;
  role: "user" | "admin";
  passwordHash?: string;
  google?: {
    sub: string;
    email?: string;
    accessTokenEnc?: string;
    refreshTokenEnc?: string;
    expiresAt?: string;
    picture?: string;
  };
  facebook?: {
    userId: string;
    accessTokenEnc?: string;
    pages?: { id: string; name: string; accessTokenEnc?: string; picture?: string }[];
  };
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
};

function encryptIfPresent(v: unknown) {
  if (!v || typeof v !== "string") return undefined;
  const m = encryptTokenMap({ v });
  return (m.values as Record<string, string>).v;
}
function decryptIfPresent(enc?: string) {
  if (!enc) return undefined;
  try {
    return decryptToken(enc) as string;
  } catch {
    try {
      const m = decryptTokenMap({ v: enc } as unknown as Record<string, unknown>);
      return m.v as string | undefined;
    } catch {
      return undefined;
    }
  }
}

export async function findUserByEmail(email: string) {
  const db = await getDb();
  return db.collection<UserDoc>("users").findOne({ email: email.toLowerCase() });
}
export async function findUserByGoogleSub(sub: string) {
  const db = await getDb();
  return db.collection<UserDoc>("users").findOne({ "google.sub": sub });
}
export async function findUserByFacebookId(userId: string) {
  const db = await getDb();
  return db.collection<UserDoc>("users").findOne({ "facebook.userId": userId });
}
export async function findUserById(id: string) {
  const db = await getDb();
  return db.collection<UserDoc>("users").findOne({ _id: new ObjectId(id) });
}

export async function upsertUserFromGoogle(
  profile: { sub: string; email?: string; name?: string; picture?: string },
  tokens: { access_token?: string; refresh_token?: string; expires_at?: number },
) {
  const db = await getDb();
  const now = new Date();
  const email = profile.email?.toLowerCase();
  let user: UserDoc | null = null;
  if (profile.sub) user = await findUserByGoogleSub(profile.sub);
  if (!user && email) user = await findUserByEmail(email);
  const encAccess = tokens.access_token ? encryptIfPresent(tokens.access_token) : undefined;
  const encRefresh = tokens.refresh_token ? encryptIfPresent(tokens.refresh_token) : undefined;
  const expiresAt = tokens.expires_at ? new Date(tokens.expires_at * 1000).toISOString() : undefined;

  if (user) {
    const update: Record<string, unknown> = { updatedAt: now, lastLoginAt: now };
    if (profile.name) update["name"] = profile.name;
    if (profile.picture) update["image"] = profile.picture;
    update["google.sub"] = profile.sub;
    if (profile.email) update["google.email"] = profile.email;
    if (encAccess) update["google.accessTokenEnc"] = encAccess;
    if (encRefresh) update["google.refreshTokenEnc"] = encRefresh;
    if (expiresAt) update["google.expiresAt"] = expiresAt;
    if (profile.picture) update["google.picture"] = profile.picture;
    await db.collection<UserDoc>("users").updateOne({ _id: user._id }, { $set: update });
    return { ...(user as UserDoc), ...update, _id: user._id } as UserDoc;
  }
  const doc: UserDoc = {
    email: email || `${profile.sub}@google.local`,
    name: profile.name,
    image: profile.picture,
    role: "user",
    google: {
      sub: profile.sub,
      email: profile.email,
      accessTokenEnc: encAccess,
      refreshTokenEnc: encRefresh,
      expiresAt,
      picture: profile.picture,
    },
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };
  const res = await db.collection<UserDoc>("users").insertOne(doc as unknown as UserDoc);
  return { ...doc, _id: res.insertedId } as UserDoc;
}

export async function upsertUserFromFacebook(
  profile: { id: string; email?: string; name?: string; picture?: string },
  tokens: { access_token?: string },
) {
  const db = await getDb();
  const now = new Date();
  const email = profile.email?.toLowerCase();
  let user: UserDoc | null = null;
  if (profile.id) user = await findUserByFacebookId(profile.id);
  if (!user && email) user = await findUserByEmail(email);
  const encAccess = tokens.access_token ? encryptIfPresent(tokens.access_token) : undefined;

  if (user) {
    const update: Record<string, unknown> = { updatedAt: now, lastLoginAt: now };
    if (profile.name) update["name"] = profile.name;
    if (profile.picture) update["image"] = profile.picture;
    update["facebook.userId"] = profile.id;
    if (encAccess) update["facebook.accessTokenEnc"] = encAccess;
    await db.collection<UserDoc>("users").updateOne({ _id: user._id }, { $set: update });
    return { ...(user as UserDoc), ...update, _id: user._id } as UserDoc;
  }
  const doc: UserDoc = {
    email: email || `${profile.id}@facebook.local`,
    name: profile.name,
    image: profile.picture,
    role: "user",
    facebook: { userId: profile.id, accessTokenEnc: encAccess },
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };
  const res = await db.collection<UserDoc>("users").insertOne(doc as unknown as UserDoc);
  return { ...doc, _id: res.insertedId } as UserDoc;
}

export function getDecryptedGoogleAccessToken(user: UserDoc) {
  return decryptIfPresent(user.google?.accessTokenEnc);
}
export function getDecryptedFacebookAccessToken(user: UserDoc) {
  return decryptIfPresent(user.facebook?.accessTokenEnc);
}


export async function ensureSeededAdmin() {
  const email = (process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS?.split(",")[0] || "").trim().toLowerCase();
  const plain = process.env.ADMIN_PASSWORD;
  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!email || (!plain && !hash)) return null;
  const db = await getDb();
  let existing = await db.collection<UserDoc>("users").findOne({ email });
  let passwordHash = hash;
  if (!passwordHash && plain) {
    const bcrypt = await import("bcryptjs");
    passwordHash = await bcrypt.hash(plain, 10);
  }
  if (!passwordHash) return null;
  const now = new Date();
  if (existing) {
    const needsUpdate = existing.role !== "admin" || existing.passwordHash !== passwordHash;
    if (needsUpdate) {
      await db.collection<UserDoc>("users").updateOne({ _id: existing._id }, { $set: { role: "admin", passwordHash, updatedAt: now } });
      existing = { ...existing, role: "admin" as const, passwordHash, updatedAt: now };
    }
    return existing;
  }
  const doc: UserDoc = {
    email,
    name: "Admin",
    role: "admin",
    passwordHash,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };
  const res = await db.collection<UserDoc>("users").insertOne(doc as unknown as UserDoc);
  return { ...doc, _id: res.insertedId } as UserDoc;
}

export async function verifyAdminPassword(email: string, password: string) {
  const db = await getDb();
  const user = await db.collection<UserDoc>("users").findOne({ email: email.toLowerCase() });
  if (!user?.passwordHash) return null;
  const bcrypt = await import("bcryptjs");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  if (user.role !== "admin") return null;
  await db.collection<UserDoc>("users").updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  return user;
}

