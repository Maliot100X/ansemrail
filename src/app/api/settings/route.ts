import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { encryptApiKey, decryptApiKey } from "@/lib/crypto";
import { getRequestUser, getUserPayboxPolicies } from "@/lib/auth-session";
import { listAgents } from "@/lib/clawpump";
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
    let clawpumpProfile: any = encryptedKeys.clawpumpProfile
      ? (() => {
          try {
            return JSON.parse(decryptApiKey(encryptedKeys.clawpumpProfile));
          } catch {
            return null;
          }
        })()
      : null;
    if (encryptedKeys.clawpumpApiKey && !clawpumpProfile) {
      try {
        const key = decryptApiKey(encryptedKeys.clawpumpApiKey);
        const agents = await listAgents(key);
        clawpumpProfile = { agents };
      } catch {
        clawpumpProfile = null;
      }
    }
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
      hasClawpumpKey: !!encryptedKeys.clawpumpApiKey,
      hasPayboxKey: !!encryptedKeys.payboxApiKey,
      hasPayboxSigningKey: !!encryptedKeys.payboxSigningKey,
      payboxPolicies: await getUserPayboxPolicies(row.id),
      clawpumpProfile,
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
      payboxApiKey,
      payboxSigningKey,
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
    let clawpumpProfile: any = null;

    if (clawpumpApiKey !== undefined && clawpumpApiKey !== "") {
      // Verify the key against the live ClawPump API before saving
      try {
        const agents = await listAgents(clawpumpApiKey, { fresh: true });
        clawpumpProfile = { agents };
      } catch (verifyErr: any) {
        return NextResponse.json(
          {
            error:
              "Invalid ClawPump API key — could not connect to clawpump.tech. Check the key and try again.",
            detail: verifyErr.message,
          },
          { status: 400 }
        );
      }
      const existingEncryptedKeys =
        (existing.encryptedKeys as Record<string, string>) || {};
      existingEncryptedKeys.clawpumpApiKey = encryptApiKey(clawpumpApiKey);
      existingEncryptedKeys.clawpumpProfile = encryptApiKey(
        JSON.stringify(clawpumpProfile)
      );
      updateData.encryptedKeys = existingEncryptedKeys;
    }
    if (payboxApiKey !== undefined && payboxApiKey !== "") {
      const existingEncryptedKeys =
        (updateData.encryptedKeys as Record<string, string>) ||
        ((existing.encryptedKeys as Record<string, string>) || {});
      existingEncryptedKeys.payboxApiKey = encryptApiKey(payboxApiKey);
      updateData.encryptedKeys = existingEncryptedKeys;
    }
    if (payboxSigningKey !== undefined && payboxSigningKey !== "") {
      if (!payboxSigningKey.startsWith("pbxk1.")) {
        return NextResponse.json(
          { error: "PayBox signing key must start with pbxk1." },
          { status: 400 }
        );
      }
      const existingEncryptedKeys =
        (updateData.encryptedKeys as Record<string, string>) ||
        ((existing.encryptedKeys as Record<string, string>) || {});
      existingEncryptedKeys.payboxSigningKey = encryptApiKey(payboxSigningKey);
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
      clawpump: clawpumpProfile,
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
