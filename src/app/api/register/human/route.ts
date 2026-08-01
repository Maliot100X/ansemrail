import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users, registrations } from "@/db/schema";
import { encryptApiKey } from "@/lib/crypto";
import { eq } from "drizzle-orm";

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

    let existingUser: typeof users.$inferSelect | undefined;
    if (email) {
      const [found] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      existingUser = found;
    }

    const encryptedKey = clawpumpApiKey ? encryptApiKey(clawpumpApiKey) : null;

    if (existingUser) {
      const [updated] = await db
        .update(users)
        .set({
          walletAddress: walletAddress || existingUser.walletAddress,
          clawpumpApiKey: encryptedKey || existingUser.clawpumpApiKey,
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
          payload: { walletAddress, moonpayEmail, hasApiKey: !!encryptedKey },
        });

      return NextResponse.json({
        userId: updated!.id,
        message: "Human registration updated successfully",
      });
    }

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        googleId,
        walletAddress,
        clawpumpApiKey: encryptedKey,
        moonpayEmail,
        type: "human",
        ansemPreference: true,
      })
      .returning();

    await db.insert(registrations).values({
      userId: newUser!.id,
      type: "human",
      status: "active",
      payload: { walletAddress, moonpayEmail, hasApiKey: !!encryptedKey },
    });

    return NextResponse.json(
      {
        userId: newUser!.id,
        message: "Human registered successfully",
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
