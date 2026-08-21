import { NextRequest, NextResponse } from "next/server";
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
};

// Admin-only bounty actions: payout, approve, reject
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminSecret = process.env.REWARDS_ADMIN_SECRET;
    const authHeader = request.headers.get("authorization") || "";
    const isAdmin = adminSecret && authHeader === `Bearer ${adminSecret}`;

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [bounty] = await db.select().from(bounties).where(eq(bounties.id, id)).limit(1);
    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body; // "payout", "approve", "reject"

    // Handle admin approve/reject
    if (isAdmin && action !== "payout") {
      if (action === "approve") {
        if (bounty.status !== "completed") {
          return NextResponse.json({ error: "Bounty must be completed before approval" }, { status: 400 });
        }
        // Mark as approved for payout - keep status as completed, just note admin approved
        await db
          .update(bounties)
          .set({ approvedByAdmin: true, updatedAt: new Date() })
          .where(eq(bounties.id, id));
        return NextResponse.json({ success: true, message: "Bounty approved by admin" });
      }

      if (action === "reject") {
        const { reason } = body;
        if (!reason) {
          return NextResponse.json({ error: "Reject reason is required" }, { status: 400 });
        }
        await db
          .update(bounties)
          .set({ status: "rejected", rejectReason: reason, approvedByAdmin: false, updatedAt: new Date() })
          .where(eq(bounties.id, id));
        // Notify the submitter via Telegram if possible
        try {
          const [creator] = bounty.creatorUserId ? await db.select().from(users).where(eq(users.id, bounty.creatorUserId)).limit(1) : [null];
          if (creator && creator.telegramChatId) {
            await sendMessage(
              creator.telegramChatId,
              `❌ <b>Bounty Rejected</b>\n\n` +
              `Bounty: ${bounty.title}\n` +
              `Reason: ${reason}\n\n` +
              `View your dashboard: https://ansemrail.vercel.app/dashboard`
            );
          }
        } catch {}
        return NextResponse.json({ success: true, message: "Bounty rejected by admin" });
      }

      return NextResponse.json({ error: "Invalid admin action" }, { status: 400 });
    }

    // Handle payout (admin or non-admin)
    if (bounty.status !== "completed") {
      return NextResponse.json({ error: "Bounty must be completed before payout" }, { status: 400 });
    }

    // Get the assignee's wallet address
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

    // Check treasury is configured
    const treasuryKeypair = await getTreasuryKeypair();
    if (!treasuryKeypair) {
      return NextResponse.json({ error: "Treasury wallet not configured" }, { status: 500 });
    }

    const treasuryAddr = await treasureWalletAddress();
    if (!treasuryAddr) {
      return NextResponse.json({ error: "Treasury address not found" }, { status: 500 });
    }

    // Map token to mint
    const token = (bounty.rewardToken || "CLAWRENA").toUpperCase();
    const mint = TOKEN_MINTS[token] || TOKEN_MINTS["CLAWRENA"];
    const amount = parseFloat(bounty.rewardAmount);

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid reward amount" }, { status: 400 });
    }

    // Send real SPL token transfer from treasury
    let txSignature: string;
    try {
      txSignature = await sendSplReward(mint, payoutWallet, amount);
    } catch (err: any) {
      return NextResponse.json({ error: "Payout failed: " + err.message }, { status: 500 });
    }

    // Mark bounty as paid
    await db
      .update(bounties)
      .set({ status: "paid", updatedAt: new Date() })
      .where(eq(bounties.id, id));

    // Notify via Telegram
    try {
      if (assignee.telegramChatId) {
        await sendMessage(
          assignee.telegramChatId,
          `🎉 <b>Bounty Paid!</b>\n\n` +
          `Task: ${bounty.title}\n` +
          `Reward: ${bounty.rewardAmount} ${token}\n` +
          `Tx: https://solscan.io/tx/${txSignature}\n\n` +
          `View your dashboard: https://ansemrail.vercel.app/dashboard`
        );
      }
    } catch {}

    return NextResponse.json({
      success: true,
      txSignature,
      amount: bounty.rewardAmount,
      token,
      payoutWallet,
      treasury: treasuryAddr,
      message: `Paid ${bounty.rewardAmount} ${token} to ${payoutWallet}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
