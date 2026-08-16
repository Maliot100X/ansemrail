import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { rewardTasks, rewardSubmissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getRequestUser } from "@/lib/auth-session";
import { proofHash, verifyHolding } from "@/lib/rewards";
import { verifyFollow, verifyPost, verifyLink, PROJECT_HANDLE } from "@/lib/twitter";

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, proofUrl, proofWallet, proofUsername, agentId } = body;
    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    // Agent ID from AnsemRail registration must match the logged-in account.
    const agentIdClean = String(agentId || "").trim();
    if (agentIdClean && agentIdClean.toLowerCase() !== user.id.toLowerCase()) {
      return NextResponse.json(
        { error: "Agent ID does not match your AnsemRail account — use the Agent ID you got at registration." },
        { status: 400 }
      );
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
    if (existing && existing.status === "rejected") {
      // Rejected proofs are NOT completed — allow retry with the same proof.
      // Remove the old rejected row so the fresh submission becomes the active claim.
      await db.delete(rewardSubmissions).where(eq(rewardSubmissions.id, existing.id));
    } else if (existing) {
      return NextResponse.json(
        { error: "This proof was already submitted — no double claims.", submission: existing },
        { status: 409 }
      );
    }

    // Instant verification — OUR platform schema (no Twitter API):
    // X profile/post fetched publicly, on-chain holding checked via RPC, agent ID validated above.
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
        verifiedBy = "ansemrail";
        verifiedAt = new Date();
      }
    } else if (type === "twitter_post") {
      const check = await verifyPost(proofUrl, { requireMention: true, mention: handle });
      verifyResult = check;
      if (check.ok && check.auto) {
        status = "verified";
        verifiedBy = "ansemrail";
        verifiedAt = new Date();
      }
    } else if (type === "twitter_like" || type === "twitter_comment") {
      const check = await verifyPost(proofUrl, { requireMention: type === "twitter_comment", mention: handle });
      verifyResult = check;
      if (check.ok && check.auto) {
        status = "verified";
        verifiedBy = "ansemrail";
        verifiedAt = new Date();
      }
    } else if (type === "teach") {
      const check = await verifyLink(proofUrl);
      verifyResult = check;
      if (check.ok && check.auto) {
        status = "verified";
        verifiedBy = "ansemrail";
        verifiedAt = new Date();
      }
    }

    const [submission] = await db
      .insert(rewardSubmissions)
      .values({
        userId: user.id,
        taskId,
        proofUrl: proofUrl || null,
        proofWallet: proofWallet || null,
        proofUsername: proofUsername ? proofUsername.replace(/^@/, "") : null,
        proofAgentId: user.id,
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
            ? "Verified instantly on AnsemRail — reward is queued for payout."
            : "Proof could not be auto-verified — pending review.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to submit proof" }, { status: 500 });
  }
}
