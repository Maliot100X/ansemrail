import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { rewardSubmissions, rewardPayments, rewardTasks, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendSplReward, ANSEM_MINT, CLAW_MINT, PROJECT_MINT } from "@/lib/rewards";

function authorized(request: NextRequest): boolean {
  const secret = process.env.REWARDS_ADMIN_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

const TOKEN_MINT: Record<string, string> = {
  ANSEM: ANSEM_MINT,
  CLAW: CLAW_MINT,
  PROJECT: PROJECT_MINT,
};

export async function POST(request: NextRequest) {
  try {
    if (!authorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { submissionId, action } = await request.json();
    if (!submissionId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "submissionId and action (approve|reject) are required" }, { status: 400 });
    }

    const [submission] = await db
      .select()
      .from(rewardSubmissions)
      .where(eq(rewardSubmissions.id, submissionId))
      .limit(1);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (action === "reject") {
      const [updated] = await db
        .update(rewardSubmissions)
        .set({ status: "rejected", verifiedBy: "admin" })
        .where(eq(rewardSubmissions.id, submissionId))
        .returning();
      return NextResponse.json({ submission: updated, message: "Submission rejected." });
    }

    // Approve → pay from treasury (idempotent)
    const [existingPayment] = await db
      .select()
      .from(rewardPayments)
      .where(eq(rewardPayments.submissionId, submissionId))
      .limit(1);
    if (existingPayment) {
      return NextResponse.json(
        { error: "Already paid for this submission.", payment: existingPayment },
        { status: 409 }
      );
    }

    const [task] = await db
      .select()
      .from(rewardTasks)
      .where(eq(rewardTasks.id, submission.taskId || ""))
      .limit(1);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const mint = TOKEN_MINT[task.rewardToken] || ANSEM_MINT;
    const amount = Number(task.rewardAmount) || 0;
    if (amount <= 0) {
      return NextResponse.json({ error: "Invalid reward amount" }, { status: 400 });
    }

    const [user] = submission.userId
      ? await db.select().from(users).where(eq(users.id, submission.userId)).limit(1)
      : [];
    const toWallet = submission.proofWallet || user?.walletAddress;
    if (!toWallet) {
      return NextResponse.json(
        { error: "No Solana wallet on this submission — user must add a proof wallet or register a wallet." },
        { status: 400 }
      );
    }

    let txSignature: string | null = null;
    try {
      txSignature = await sendSplReward(mint, toWallet, amount);
    } catch (e: any) {
      return NextResponse.json(
        {
          error: "Payout failed — treasury may need funding or the mint account.",
          detail: e.message,
          nextStep: "Fund the treasury with the reward token, then re-approve (idempotent — no double pay).",
        },
        { status: 500 }
      );
    }

    const [payment] = await db
      .insert(rewardPayments)
      .values({
        submissionId,
        userId: submission.userId,
        taskId: submission.taskId,
        token: task.rewardToken,
        amount: String(amount),
        txSignature,
        status: "paid",
      })
      .returning();

    const [updated] = await db
      .update(rewardSubmissions)
      .set({ status: "verified", verifiedBy: "admin", verifiedAt: new Date() })
      .where(eq(rewardSubmissions.id, submissionId))
      .returning();

    return NextResponse.json({
      message: `Reward paid: ${amount} ${task.rewardToken} → ${toWallet}`,
      txSignature,
      payment,
      submission: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to decide submission" }, { status: 500 });
  }
}
