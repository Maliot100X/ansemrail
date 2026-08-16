import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { rewardTasks, rewardSubmissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAnsemTokenInfo, getClawTokenInfo } from "@/lib/moonpay";
import { getRequestUser } from "@/lib/auth-session";
import {
  ANSEM_MINT,
  CLAW_MINT,
  PROJECT_MINT,
  PROJECT_SYMBOL,
  TWITTER_HANDLE,
  TWITTER_URL,
  treasureWalletAddress,
  getTreasurySolBalance,
  getWalletHolding,
} from "@/lib/rewards";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    const [tasksRes, ansemRes, clawRes, treasuryRes] = await Promise.allSettled([
      db.select().from(rewardTasks).where(eq(rewardTasks.active, true)).orderBy(rewardTasks.sortOrder),
      getAnsemTokenInfo(),
      getClawTokenInfo(),
      (async () => {
        const address = await treasureWalletAddress();
        if (!address) return null;
        const [ansem, claw, project, sol] = await Promise.allSettled([
          getWalletHolding(address, ANSEM_MINT),
          getWalletHolding(address, CLAW_MINT),
          getWalletHolding(address, PROJECT_MINT),
          getTreasurySolBalance(address),
        ]);
        return {
          address,
          sol: sol.status === "fulfilled" ? sol.value : 0,
          ansemBase: ansem.status === "fulfilled" ? ansem.value : 0,
          clawBase: claw.status === "fulfilled" ? claw.value : 0,
          projectBase: project.status === "fulfilled" ? project.value : 0,
        };
      })(),
    ]);

    const ansem = ansemRes.status === "fulfilled" ? ansemRes.value : null;
    const claw = clawRes.status === "fulfilled" ? clawRes.value : null;
    const treasury = treasuryRes.status === "fulfilled" ? treasuryRes.value : null;

    // user submissions map (so UI can show "claimed" state)
    let mySubs: any[] = [];
    if (user?.id) {
      mySubs = await db
        .select()
        .from(rewardSubmissions)
        .where(eq(rewardSubmissions.userId, user.id));
    }
    const subByTask = new Map<string, any>();
    for (const s of mySubs) {
      if (!subByTask.has(s.taskId || "")) subByTask.set(s.taskId || "", s);
    }

    const tasks = (tasksRes.status === "fulfilled" ? tasksRes.value : []).map((t) => {
      const proof = (t.proofJson as any) || {};
      return {
        ...t,
        proof: {
          mint: proof.mint || null,
          minUsd: proof.minUsd || null,
          minBalance: proof.minBalance || null,
          mention: proof.mention || null,
          pinned: !!proof.pinned,
        },
        price: {
          ANSEM: ansem?.marketData?.price ?? null,
          CLAW: claw?.marketData?.price ?? null,
          PROJECT: proof.refPrice ?? null,
        },
        mySubmission: subByTask.get(t.id || "") || null,
      };
    });

    return NextResponse.json({
      project: {
        mint: PROJECT_MINT,
        symbol: PROJECT_SYMBOL,
        twitterHandle: TWITTER_HANDLE,
        twitterUrl: TWITTER_URL,
        buyLink: `https://pump.fun/coin/${PROJECT_MINT}`,
      },
      treasury,
      tokens: {
        ANSEM: { mint: ANSEM_MINT, price: ansem?.marketData?.price ?? null },
        CLAW: { mint: CLAW_MINT, price: claw?.marketData?.price ?? null },
        PROJECT: { mint: PROJECT_MINT, symbol: PROJECT_SYMBOL, price: null },
      },
      tasks,
      counts: {
        tasks: tasks.length,
        claimed: mySubs.length,
        verified: mySubs.filter((s) => s.status === "verified").length,
        pending: mySubs.filter((s) => s.status === "pending").length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load rewards" }, { status: 500 });
  }
}
