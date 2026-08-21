import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users, registrations } from "@/db/schema";
import { encryptApiKey } from "@/lib/crypto";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { getRequestUser } from "@/lib/auth-session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, googleId, walletAddress, clawpumpApiKey, moonpayEmail } = body;

    if (!email && !walletAddress) {
      return NextResponse.json(
        { error: "Either email or walletAddress is required" },
        { status: 400 }
      );
    }

    const authToken = randomBytes(32).toString("hex");
    const encryptedKeys: Record<string, string> = {};
    if (clawpumpApiKey) {
      encryptedKeys.clawpumpApiKey = encryptApiKey(clawpumpApiKey);
    }

    let existingUser: typeof users.$inferSelect | undefined;
    if (email) {
      const [found] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      existingUser = found;
    }

    if (existingUser) {
      const authenticatedUser = await getRequestUser(request);
      if (authenticatedUser?.id !== existingUser.id) {
        return NextResponse.json(
          { error: "Account already exists. Sign in with your token or Google account." },
          { status: 409 }
        );
      }

      const existingEncryptedKeys = (existingUser.encryptedKeys as Record<string, string>) || {};
      const mergedKeys = { ...existingEncryptedKeys, ...encryptedKeys };

      const [updated] = await db
        .update(users)
        .set({
          walletAddress: walletAddress || existingUser.walletAddress,
          encryptedKeys: mergedKeys,
          payoutWallet: walletAddress || existingUser.payoutWallet,
          moonpayEmail: moonpayEmail || existingUser.moonpayEmail,
          googleId: googleId || existingUser.googleId,
          type: "human",
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();

      await db
        .insert(registrations)
        .values({
          userId: updated!.id,
          type: "human",
          status: "active",
          payload: { walletAddress, moonpayEmail, hasApiKey: !!clawpumpApiKey },
        });

      return NextResponse.json({
        userId: updated!.id,
        authToken: existingUser.clawpumpApiKey,
        message: "Human registration updated successfully. Use your authToken to log in.",
      });
    }

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        googleId,
        walletAddress,
        payoutWallet: walletAddress || null,
        clawpumpApiKey: authToken,
        encryptedKeys: Object.keys(encryptedKeys).length > 0 ? encryptedKeys : null,
        moonpayEmail,
        type: "human",
        ansemPreference: true,
      })
      .returning();

    await db.insert(registrations).values({
      userId: newUser!.id,
      type: "human",
      status: "active",
      payload: { walletAddress, moonpayEmail, hasApiKey: !!clawpumpApiKey },
    });

    return NextResponse.json(
      {
        userId: newUser!.id,
        authToken,
        message: "Human registered successfully. Use your authToken to log in.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Human registration error:", error.message);
    return NextResponse.json(
      { error: "Registration failed", detail: error.message },
      { status: 500 }
    );
  }
}
