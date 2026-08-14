import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { encryptApiKey } from "@/lib/crypto";
import { getRequestUser } from "@/lib/auth-session";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    if (!row) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const encryptedKeys = (row.encryptedKeys as Record<string, string>) || {};
    return NextResponse.json({
      userId: row.id,
      email: row.email,
      type: row.type,
      walletAddress: row.walletAddress,
      moonpayEmail: row.moonpayEmail,
      payoutWallet: row.payoutWallet,
      telegramChatId: row.telegramChatId,
      owsWalletName: row.owsWalletName,
      ansemPreference: row.ansemPreference,
      hasClawpumpKey: !!encryptedKeys.clawpumpApiKey || !!row.clawpumpApiKey,
    });
  } catch (error: any) {
    console.error("Settings GET error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const body = await request.json();
    const {
      clawpumpApiKey,
      moonpayEmail,
      payoutWallet,
      telegramChatId,
      owsWalletName,
      ansemPreference,
    } = body;

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (clawpumpApiKey !== undefined) {
      const existingEncryptedKeys =
        (existing.encryptedKeys as Record<string, string>) || {};
      existingEncryptedKeys.clawpumpApiKey = encryptApiKey(clawpumpApiKey);
      updateData.encryptedKeys = existingEncryptedKeys;
    }
    if (moonpayEmail !== undefined) updateData.moonpayEmail = moonpayEmail;
    if (payoutWallet !== undefined) updateData.payoutWallet = payoutWallet;
    if (telegramChatId !== undefined) updateData.telegramChatId = telegramChatId;
    if (owsWalletName !== undefined) updateData.owsWalletName = owsWalletName;
    if (ansemPreference !== undefined) updateData.ansemPreference = ansemPreference;

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning();

    return NextResponse.json({
      userId: updated!.id,
      message: "Settings updated successfully",
    });
  } catch (error: any) {
    console.error("Settings PUT error:", error.message);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === "generate-telegram-code") {
      const code = randomBytes(4).toString("hex");
      const expiry = new Date(Date.now() + 10 * 60 * 1000);
      await db
        .update(users)
        .set({
          telegramVerifyCode: code,
          telegramVerifyExpiry: expiry,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
      return NextResponse.json({
        code,
        expiresIn: "10 minutes",
        message: "Send /link " + code + " to @AnsemClawBot on Telegram",
      });
    }

    if (action === "unlink-telegram") {
      await db
        .update(users)
        .set({
          telegramChatId: null,
          telegramVerifyCode: null,
          telegramVerifyExpiry: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
      return NextResponse.json({ message: "Telegram unlinked successfully" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Settings POST error:", error.message);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
