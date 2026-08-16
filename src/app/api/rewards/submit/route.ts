import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { rewardTasks, rewardSubmissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getRequestUser } from "@/lib/auth-session";
import { proofHash, verifyHolding } from "@/lib/rewards";
import { verifyFollow, verifyPost, PROJECT_HANDLE } from "@/lib/twitter";

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, proofUrl, proofWallet, proofUsername } = body;
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
    const handle = proof.handle || PROJECT_HANDLE;

    if (type === "twitter_follow" && !proofUsername) {
      return NextResponse.json({ error: "Your X username is required — enter the username that follows @" + handle }, { status: 400 });
    }
    if ((type === "twitter_like" || type === "twitter_comment" || type === "twitter_post") && !proofUrl) {
      return NextResponse.json({ error: "Your X post link is required" }, { status: 400 });
    }
    if ((type === "buy_coin" || type === "holding" || type === "custom") && !proofWallet) {
      return NextResponse.json({ error: "proofWallet (the Solana wallet for the reward) is required" }, { status: 400 });
    }
    if (type === "teach" && !proofUrl) {
      return NextResponse.json({ error: "proofUrl (proof link for the ClawPump help) is required" }, { status: 400 });
    }

    // Unique proof — same (user + task + proof) can never be claimed twice
    const hash = proofHash([user.id, taskId, proofUrl || "", proofWallet || "", (proofUsername || "").replace(/^@/, "").toLowerCase()]);
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

    // Verification per task type
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
    } else if (type === "custom" && proof.mint && proof.minBalance) {
      const check = await verifyHolding(proofWallet, proof.mint, proof.minBalance || "0");
      verifyResult = check;
      if (check.ok) {
        status = "verified";
        verifiedBy = "auto-onchain";
        verifiedAt = new Date();
      }
    } else if (type === "twitter_follow") {
      const check = await verifyFollow(proofUsername, handle);
      verifyResult = check;
      if (check.ok && check.auto) {
        status = "verified";
        verifiedBy = check.method;
        verifiedAt = new Date();
      } else {
        status = "pending"; // admin confirms the follow (or X API key needed)
      }
    } else if (type === "twitter_post") {
      const check = await verifyPost(proofUrl, { requireMention: true, mention: handle });
      verifyResult = check;
      if (check.ok && check.auto) {
        status = "verified";
        verifiedBy = check.method;
        verifiedAt = new Date();
      } else {
        status = "pending";
      }
    } else if (type === "twitter_like" || type === "twitter_comment") {
      const check = await verifyPost(proofUrl, {
        requireMention: type === "twitter_comment",
        mention: handle,
      });
      verifyResult = check;
      status = "pending"; // like/comment always reviewed by admin
    }

    const [submission] = await db
      .insert(rewardSubmissions)
      .values({
        userId: user.id,
        taskId,
        proofUrl: proofUrl || null,
        proofWallet: proofWallet || null,
        proofUsername: proofUsername ? proofUsername.replace(/^@/, "") : null,
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
            ? "Proof verified! Reward is queued for payout."
            : "Proof submitted. Verification in progress — admin review may be required.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit proof" }, { status: 500 });
  }
}
