import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { encryptApiKey } from "@/lib/crypto";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({
      userId: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      moonpayEmail: user.moonpayEmail,
      payoutWallet: user.payoutWallet,
      telegramChatId: user.telegramChatId,
      owsWalletName: user.owsWalletName,
      ansemPreference: user.ansemPreference,
      hasClawpumpKey: !!user.clawpumpApiKey,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch settings", detail: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      clawpumpApiKey,
      moonpayEmail,
      payoutWallet,
      telegramChatId,
      owsWalletName,
      ansemPreference,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (clawpumpApiKey !== undefined) {
      updateData.clawpumpApiKey = encryptApiKey(clawpumpApiKey);
    }
    if (moonpayEmail !== undefined) updateData.moonpayEmail = moonpayEmail;
    if (payoutWallet !== undefined) updateData.payoutWallet = payoutWallet;
    if (telegramChatId !== undefined) updateData.telegramChatId = telegramChatId;
    if (owsWalletName !== undefined) updateData.owsWalletName = owsWalletName;
    if (ansemPreference !== undefined) updateData.ansemPreference = ansemPreference;

    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      userId: updated.id,
      message: "Settings updated successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update settings", detail: error.message },
      { status: 500 }
    );
  }
}
