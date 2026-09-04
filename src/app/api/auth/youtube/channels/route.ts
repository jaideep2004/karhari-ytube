import { auth } from "@/auth";
import { findUserByEmail } from "@/lib/db/users";
import { decryptToken, encryptToken } from "@/lib/auth/tokenVault";
import { getDb } from "@/lib/db/mongo";

export async function GET() {
  try {
  const session = await auth();
  if (!session?.user?.email) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const user = await findUserByEmail(session.user.email);
  if (!user?.google?.accessTokenEnc) return Response.json({ error: "Google not linked — please connect YouTube in Settings → Connections", channels: [] }, { status: 401 });

  let token: string | undefined;
  try {
    token = decryptToken(user.google.accessTokenEnc!);
  } catch {
    return Response.json({ error: "Token decrypt failed — re-encrypt with correct TOKEN_ENCRYPTION_KEY and reconnect Google" }, { status: 500 });
  }
  if (!token) return Response.json({ error: "No access token", channels: [] }, { status: 401 });

  // Check expiry and refresh proactively if needed (like jobProcessor)
  try {
    const expiresAt = user.google.expiresAt ? new Date(user.google.expiresAt) : null;
    const isExpired = !expiresAt || expiresAt.getTime() - Date.now() < 5 * 60 * 1000;
    if (isExpired && user.google.refreshTokenEnc) {
      try {
        const refreshToken = decryptToken(user.google.refreshTokenEnc);
        const { refreshYoutubeAccessToken } = await import("@/lib/social/youtube");
        const refreshed = await refreshYoutubeAccessToken(refreshToken);
        token = refreshed.accessToken;
        // persist
        const db = await getDb();
        await db.collection("users").updateOne(
          { _id: user._id },
          { $set: { "google.accessTokenEnc": encryptToken(token), "google.expiresAt": refreshed.expiresAt.toISOString(), updatedAt: new Date() } }
        );
        console.log("[channels] refreshed expired token for", user.email);
      } catch (e) {
        console.warn("[channels] refresh failed, will try existing token", e);
      }
    }
  } catch (e) { console.warn("[channels] expiry check failed", e); }

  // Try fetching with current token, if 401 try one refresh retry
  const fetchChannels = async (tok: string) => {
    const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
      headers: { Authorization: `Bearer ${tok}` },
    });
    return res;
  };

  let res = await fetchChannels(token);
  if (res.status === 401 && user.google.refreshTokenEnc) {
    try {
      const refreshToken = decryptToken(user.google.refreshTokenEnc);
      const { refreshYoutubeAccessToken } = await import("@/lib/social/youtube");
      const refreshed = await refreshYoutubeAccessToken(refreshToken);
      token = refreshed.accessToken;
      const db = await getDb();
      await db.collection("users").updateOne(
        { _id: user._id },
        { $set: { "google.accessTokenEnc": encryptToken(token), "google.expiresAt": refreshed.expiresAt.toISOString(), updatedAt: new Date() } }
      );
      console.log("[channels] retry after 401 with refreshed token");
      res = await fetchChannels(token);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return Response.json({ error: `YouTube token expired and refresh failed: ${msg} — please reconnect Google`, channels: [] }, { status: 401 });
    }
  }

  if (!res.ok) {
    const txt = await res.text();
    // Provide actionable message
    let hint = "";
    if (res.status === 401) hint = " — token expired, please reconnect YouTube in Settings → Connections";
    if (res.status === 403) hint = " — check YouTube API quota or channel permissions";
    return Response.json({ error: `YouTube API ${res.status}: ${txt}${hint}`, channels: [] }, { status: res.status });
  }
  try {
    const data = await res.json();
    const channels = (data.items || []).map((c: { id: string; snippet?: { title?: string; thumbnails?: { default?: { url?: string } } } }) => ({
      id: c.id,
      title: c.snippet?.title || "Untitled",
      thumbnailUrl: c.snippet?.thumbnails?.default?.url || "",
    }));
    return Response.json({ channels });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg, channels: [] }, { status: 500 });
  }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // DB SRV ECONNREFUSED / timeout — return JSON instead of empty 500 so client can show Retry
    console.error("[channels] unhandled", msg);
    return Response.json({ error: `Server temporarily unavailable (${msg.slice(0,120)}) — please hit Retry in a few seconds`, channels: [] }, { status: 503 });
  }
}
