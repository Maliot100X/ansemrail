import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-session";
import { db } from "@/db/client";
import { bounties, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendSplReward, ANSEM_MINT, CLAW_MINT, PROJECT_MINT, getTreasuryKeypair, treasureWalletAddress } from "@/lib/rewards";
import { sendMessage } from "@/lib/telegram";

const TOKEN_MINTS: Record<string, string> = {
  ANSEM: ANSEM_MINT,
  CLAW: CLAW_MINT,
  CLAWRENA: PROJECT_MINT,
  PROJECT: PROJECT_MINT,
  SOL: "So11111111111111111111111111111111111111112",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const [bounty] = await db.select().from(bounties).where(eq(bounties.id, id)).limit(1);
    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    if (bounty.status !== "completed" && bounty.status !== "approved") {
      return NextResponse.json({ error: "Bounty must be completed or approved before payout" }, { status: 400 });
    }

    const assigneeId = bounty.assigneeUserId;
    if (!assigneeId) {
      return NextResponse.json({ error: "No assignee for this bounty" }, { status: 400 });
    }

    const [assignee] = await db.select().from(users).where(eq(users.id, assigneeId)).limit(1);
    if (!assignee) {
      return NextResponse.json({ error: "Assignee not found" }, { status: 404 });
    }

    const payoutWallet = assignee.payoutWallet;
    if (!payoutWallet) {
      return NextResponse.json({ error: "Assignee has no payout wallet set" }, { status: 400 });
    }

    const treasuryKeypair = await getTreasuryKeypair();
    if (!treasuryKeypair) {
      return NextResponse.json({ error: "Treasury wallet not configured" }, { status: 500 });
    }

    const token = (bounty.rewardToken || "CLAWRENA").toUpperCase();
    const mint = TOKEN_MINTS[token];
    if (!mint) {
      return NextResponse.json({ error: `Unsupported token: ${token}` }, { status: 400 });
    }

    const amount = parseFloat(bounty.rewardAmount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid reward amount" }, { status: 400 });
    }

    let txSignature: string;
    try {
      txSignature = await sendSplReward(mint, payoutWallet, amount);
    } catch (err: any) {
      return NextResponse.json({ error: "Payout failed: " + err.message }, { status: 500 });
    }

    await db
      .update(bounties)
      .set({ status: "paid", updatedAt: new Date() })
      .where(eq(bounties.id, id));

    try {
      if (assignee.telegramChatId) {
        await sendMessage(
          assignee.telegramChatId,
          "🎉 <b>Bounty Paid!</b>\n\nTask: " + bounty.title + "\nReward: " + bounty.rewardAmount + " " + token + "\nTx: https://solscan.io/tx/" + txSignature
        );
      }
    } catch {}

    return NextResponse.json({
      success: true,
      txSignature,
      amount: bounty.rewardAmount,
      token,
      payoutWallet,
      treasury: await treasureWalletAddress(),
      message: "Paid " + bounty.rewardAmount + " " + token + " to " + payoutWallet,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
