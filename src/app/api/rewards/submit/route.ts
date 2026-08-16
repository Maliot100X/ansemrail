import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { rewardTasks, rewardSubmissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getRequestUser } from "@/lib/auth-session";
import { proofHash, verifyHolding, verifyTwitterPost } from "@/lib/rewards";

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, proofUrl, proofWallet } = body;
    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const [task] = await db
      .select()
      .from(rewardTasks)
      .where(eq(rewardTasks.id, taskId))
      .limit(1);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (!task.active) {
      return NextResponse.json({ error: "Task is not active" }, { status: 400 });
    }

    const proof = (task.proofJson as any) || {};
    const type = task.type;

    if ((type === "twitter_follow" || type === "twitter_like" || type === "twitter_comment" || type === "twitter_post") && !proofUrl) {
      return NextResponse.json({ error: "proofUrl (your X post link) is required" }, { status: 400 });
    }
    if ((type === "buy_coin" || type === "holding" || type === "custom") && !proofWallet) {
      return NextResponse.json({ error: "proofWallet (the Solana wallet holding the coins) is required" }, { status: 400 });
    }

    // Unique proof — same (user + task + proof) can never be claimed twice
    const hash = proofHash([user.id, taskId, proofUrl || "", proofWallet || ""]);
    const [existing] = await db
      .select()
      .from(rewardSubmissions)
      .where(eq(rewardSubmissions.proofHash, hash))
      .limit(1);
    if (existing) {
      return NextResponse.json(
        { error: "This proof was already submitted — no double claims.", submission: existing },
        { status: 409 }
      );
    }

    // Automatic on-chain verification for buy/holding tasks
    let status = "pending";
    let verifiedBy: string | null = null;
    let verifiedAt: Date | null = null;
    let verifyResult: any = null;

    if (type === "buy_coin" && proof.mint) {
      const check = await verifyHolding(proofWallet, proof.mint, proof.minBalance || "0");
      verifyResult = check;
      if (check.ok) {
        status = "verified";
        verifiedBy = "auto-onchain";
        verifiedAt = new Date();
      }
    } else if (type === "twitter_follow" || type === "twitter_like" || type === "twitter_comment" || type === "twitter_post") {
      const check = await verifyTwitterPost(proofUrl, proof.handle || "CLAWRENAi");
      verifyResult = check;
      // Do not auto-pay Twitter tasks — admin reviews likes/follows/comments.
      status = check.reachable ? "pending" : "pending";
    }

    const [submission] = await db
      .insert(rewardSubmissions)
      .values({
        userId: user.id,
        taskId,
        proofUrl: proofUrl || null,
        proofWallet: proofWallet || null,
        proofHash: hash,
        status,
        verifiedBy,
        verifiedAt,
      })
      .returning();

    return NextResponse.json(
      {
        submission,
        status,
        verify: verifyResult,
        message:
          status === "verified"
            ? "Holding verified on-chain! Reward is queued for payout."
            : "Proof submitted. Verification in progress — admin review may be required for X tasks.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit proof" }, { status: 500 });
  }
}
