import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { rewardSubmissions, rewardPayments, rewardTasks, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendSplReward, ANSEM_MINT, CLAW_MINT, PROJECT_MINT } from "@/lib/rewards";
import { sendMessage } from "@/lib/telegram";

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

async function notifyUser(
  userId: string | null,
  text: string
): Promise<void> {
  if (!userId) return;
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user?.telegramChatId) {
      await sendMessage(user.telegramChatId, text);
    }
  } catch {
    // Telegram failures never break the admin flow
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!authorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const { submissionId, action, reason } = body;
    if (!submissionId || !["approve", "reject", "delete"].includes(action)) {
      return NextResponse.json({ error: "submissionId and action (approve|reject|delete) are required" }, { status: 400 });
    }
    const reasonClean = String(reason || "").trim();

    const [submission] = await db
      .select()
      .from(rewardSubmissions)
      .where(eq(rewardSubmissions.id, submissionId))
      .limit(1);
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const [task] = submission.taskId
      ? await db.select().from(rewardTasks).where(eq(rewardTasks.id, submission.taskId)).limit(1)
      : [];

    if (action === "reject") {
      const [updated] = await db
        .update(rewardSubmissions)
        .set({
          status: "rejected",
          verifiedBy: "admin",
          adminNote: reasonClean || "Rejected by admin",
        })
        .where(eq(rewardSubmissions.id, submissionId))
        .returning();
      await notifyUser(
        submission.userId,
        `❌ <b>AnsemRail Reward — ${task?.title || "Task"} rejected</b>\n\n` +
          `${reasonClean ? `Reason: ${reasonClean}\n\n` : ""}` +
          `Go to the Rewards page and retry with a new, correct proof.`
      );
      return NextResponse.json({ submission: updated, message: "Submission rejected." });
    }

    if (action === "delete") {
      const [existingPayment] = await db
        .select()
        .from(rewardPayments)
        .where(eq(rewardPayments.submissionId, submissionId))
        .limit(1);
      if (existingPayment) {
        return NextResponse.json({ error: "Cannot delete — this submission was already paid." }, { status: 400 });
      }
      await db.delete(rewardSubmissions).where(eq(rewardSubmissions.id, submissionId));
      return NextResponse.json({ ok: true, message: "Submission removed." });
    }

    // Approve → pay from treasury (idempotent — never auto-sent, admin clicks only)
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
      .set({
        status: "verified",
        verifiedBy: "admin",
        verifiedAt: new Date(),
        adminNote: reasonClean || null,
      })
      .where(eq(rewardSubmissions.id, submissionId))
      .returning();

    await notifyUser(
      submission.userId,
      `✅ <b>AnsemRail Reward paid</b>\n\n` +
        `${task.title}\n${amount} ${task.rewardToken} sent to ${toWallet}\n\n` +
        `Tx: https://solscan.io/tx/${txSignature}`
    );

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
