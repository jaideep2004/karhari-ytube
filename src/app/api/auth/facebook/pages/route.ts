import { auth } from "@/auth";
import { findUserByEmail } from "@/lib/db/users";
import { decryptToken, encryptToken } from "@/lib/auth/tokenVault";
import { getDb } from "@/lib/db/mongo";

export async function GET() {
  try {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const user = await findUserByEmail(session.user.email);
  if (!user?.facebook?.accessTokenEnc) return Response.json({ error: "Facebook not linked", pages: [] }, { status: 401 });

  let token: string | undefined;
  try {
    token = decryptToken(user.facebook.accessTokenEnc!);
  } catch {
    return Response.json({ error: "Token decrypt failed" }, { status: 500 });
  }
  if (!token) return Response.json({ error: "No access token" }, { status: 401 });

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,picture`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const txt = await res.text();
      return Response.json({ error: `Facebook API ${res.status}: ${txt}`, pages: [] }, { status: res.status });
    }
    const data = await res.json();
    const pagesRaw = (data.data || []) as { id: string; name: string; access_token?: string; picture?: { data?: { url?: string } } }[];
    const pages = pagesRaw.map((p) => ({
      id: p.id,
      name: p.name,
      picture: p.picture?.data?.url || "",
    }));

    // Persist pages with encrypted page tokens for later uploads (jobProcessor needs them)
    try {
      const pagesToStore = pagesRaw
        .filter((p) => p.access_token)
        .map((p) => ({
          id: p.id,
          name: p.name,
          accessTokenEnc: encryptToken(p.access_token!),
          picture: p.picture?.data?.url || "",
        }));
      if (pagesToStore.length && user?._id) {
        const db = await getDb();
        await db.collection("users").updateOne({ _id: user._id }, { $set: { "facebook.pages": pagesToStore, updatedAt: new Date() } });
      }
    } catch (e) {
      console.warn("[fb/pages] failed to persist pages", e);
    }

    return Response.json({ pages });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg, pages: [] }, { status: 500 });
  }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[fb/pages] unhandled", msg);
    return Response.json({ error: `Server temporarily unavailable (${msg.slice(0,120)}) — please hit Retry`, pages: [] }, { status: 503 });
  }
}
