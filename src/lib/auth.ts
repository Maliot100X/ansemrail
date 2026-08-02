import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "AnsemRail",
      credentials: {
        token: { label: "API Token", type: "text" },
      },
      async authorize(credentials: any) {
        if (!credentials?.token) return null;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.clawpumpApiKey, credentials.token as string))
          .limit(1);
        if (user) {
          return {
            id: user.id,
            email: user.email || undefined,
            name: user.type === "agent" ? "Autonomous Agent" : (user.email || "AnsemRail User"),
          };
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" as const },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
      }

      if (token.id) {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);
        if (dbUser) {
          session.user.type = dbUser.type;
          session.user.walletAddress = dbUser.walletAddress;
          session.user.hasClawpumpKey = !!(dbUser.encryptedKeys as any)?.clawpumpApiKey;
        }
      }
      return session;
    },
    async signIn({ user, account }: any) {
      if (account?.provider === "google" && user.email) {
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);
        if (!existing) {
          const { randomBytes } = await import("crypto");
          const authToken = randomBytes(32).toString("hex");
          await db.insert(users).values({
            email: user.email,
            type: "human",
            googleId: account.providerAccountId,
            clawpumpApiKey: authToken,
          });
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export default NextAuth(authOptions);
