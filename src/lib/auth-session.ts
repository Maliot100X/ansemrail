import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { decryptApiKey } from "@/lib/crypto";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface RequestUser {
  id: string;
  type: string;
  email: string | null;
}

export async function getRequestUser(
  request?: NextRequest
): Promise<RequestUser | null> {
  if (request) {
    const authHeader =
      request.headers.get("authorization") ||
      request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token) {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.clawpumpApiKey, token))
          .limit(1);
        if (user) {
          return { id: user.id, type: user.type, email: user.email };
        }
      }
    }
  }
  try {
    const session = await getServerSession(authOptions);
    const id = (session?.user as any)?.id;
    if (id) {
      return {
        id,
        type: (session?.user as any)?.type || "human",
        email: session?.user?.email || null,
      };
    }
  } catch {
    // ignore session errors
  }
  return null;
}

export async function getUserClawpumpApiKey(
  userId?: string
): Promise<string | undefined> {
  if (!userId) return undefined;
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const encryptedKeys = (user?.encryptedKeys as Record<string, string>) || {};
    if (encryptedKeys.clawpumpApiKey) {
      return decryptApiKey(encryptedKeys.clawpumpApiKey);
    }
  } catch {
    // ignore
  }
  return undefined;
}
