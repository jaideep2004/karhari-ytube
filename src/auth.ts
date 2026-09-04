import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { upsertUserFromGoogle, upsertUserFromFacebook } from "@/lib/db/users";

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube",
].join(" ");

const FACEBOOK_SCOPES = ["public_profile", "email", "pages_show_list", "pages_read_engagement", "pages_manage_posts"].join(",");

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      id: "admin-credentials",
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.trim().toLowerCase();
        const password = credentials?.password as string;
        if (!email || !password) return null;
        // Seeded admin via env vars — ensure DB has it (creates on first run)
        try {
          const { ensureSeededAdmin, verifyAdminPassword } = await import("@/lib/db/users");
          await ensureSeededAdmin().catch(() => null);
          const user = await verifyAdminPassword(email, password);
          if (!user) return null;
          return { id: String(user._id), email: user.email, name: user.name || "Admin", image: user.image } as unknown as { id: string; email: string };
        } catch (e) {
          console.error("[auth] admin authorize failed", e);
          return null;
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: GOOGLE_SCOPES,
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: FACEBOOK_SCOPES,
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Credentials (admin) — allow
        if (account?.provider === "admin-credentials") return true;
        if (account?.provider === "google" && profile) {
          const p = profile as unknown as Record<string, string>;
          await upsertUserFromGoogle(
            {
              sub: (p.sub as string) || (p.id as string) || user.id || "",
              email: user.email || (p.email as string),
              name: user.name || (p.name as string),
              picture: (user as unknown as { image?: string }).image || (p.picture as string),
            },
            {
              access_token: (account as unknown as { access_token?: string }).access_token,
              refresh_token: (account as unknown as { refresh_token?: string }).refresh_token,
              expires_at: (account as unknown as { expires_at?: number }).expires_at,
            },
          );
        }
        if (account?.provider === "facebook" && profile) {
          const p = profile as unknown as Record<string, unknown>;
          const picture = (p.picture as { data?: { url?: string } } | undefined)?.data?.url;
          await upsertUserFromFacebook(
            {
              id: (p.id as string) || user.id || "",
              email: user.email || (p.email as string),
              name: user.name || (p.name as string),
              picture: picture || (user as unknown as { image?: string }).image,
            },
            { access_token: (account as unknown as { access_token?: string }).access_token },
          );
        }
      } catch (e) {
        console.error("[auth] signIn upsert failed", e);
      }
      return true;
    },
    async jwt({ token, account, user }) {
      if (account) {
        (token as unknown as Record<string, unknown>).provider = account.provider;
        (token as unknown as Record<string, unknown>).accessToken = (account as unknown as { access_token?: string }).access_token;
      }
      if (user) {
        (token as unknown as Record<string, unknown>).userId = (user as unknown as { id?: string }).id || token.sub;
        // Mark admin role from DB or env fallback
        const email = (user.email || (token as unknown as { email?: string }).email || "") as string;
        try {
          const { findUserByEmail } = await import("@/lib/db/users");
          const dbUser = email ? await findUserByEmail(email.toLowerCase()).catch(() => null) : null;
          if (dbUser?.role === "admin") (token as unknown as Record<string, unknown>).role = "admin";
          else if (account?.provider === "admin-credentials") (token as unknown as Record<string, unknown>).role = "admin";
        } catch {}
      }
      // Persist role across refreshes
      if (!user && token.email) {
        try {
          const { findUserByEmail } = await import("@/lib/db/users");
          const dbUser = await findUserByEmail(String(token.email).toLowerCase()).catch(() => null);
          if (dbUser?.role === "admin") (token as unknown as Record<string, unknown>).role = "admin";
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session as unknown as Record<string, unknown>).userId = (token as unknown as { userId?: string }).userId || token.sub;
        (session as unknown as Record<string, unknown>).provider = (token as unknown as { provider?: string }).provider;
        (session as unknown as Record<string, unknown>).role = (token as unknown as { role?: string }).role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
