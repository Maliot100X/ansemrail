import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Agent Credentials",
      credentials: {
        agentId: { label: "Agent ID", type: "text" },
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.agentId || !credentials?.token) return null;
        const agentId = credentials.agentId as string;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.clawpumpApiKey, credentials.token as string))
          .limit(1);
        if (user) {
          return {
            id: user.id,
            email: user.email || undefined,
            name: agentId,
          };
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);
        if (!existing) {
          await db.insert(users).values({
            email: user.email,
            type: "human",
            googleId: account.providerAccountId,
          });
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/register",
  },
});
