import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { rewardSubmissions, rewardTasks } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import {
  ANSEM_MINT,
  CLAW_MINT,
  PROJECT_MINT,
  treasureWalletAddress,
  getTreasurySolBalance,
  getWalletHolding,
} from "@/lib/rewards";

export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const secret = process.env.REWARDS_ADMIN_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  try {
    if (!authorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const subs = await db
      .select()
      .from(rewardSubmissions)
      .where(eq(rewardSubmissions.status, "pending"))
      .orderBy(desc(rewardSubmissions.createdAt))
      .limit(100);
    const taskIds = [...new Set(subs.map((s) => s.taskId).filter(Boolean))] as string[];
    const tasks = taskIds.length
      ? await db.select().from(rewardTasks).where(inArray(rewardTasks.id, taskIds))
      : [];
    const taskMap = new Map(tasks.map((t) => [t.id, t]));

    const address = treasureWalletAddress();
    const [ansem, claw, project, sol] = await Promise.allSettled([
      address ? getWalletHolding(address, ANSEM_MINT) : 0,
      address ? getWalletHolding(address, CLAW_MINT) : 0,
      address ? getWalletHolding(address, PROJECT_MINT) : 0,
      address ? getTreasurySolBalance() : 0,
    ]);

    return NextResponse.json({
      treasury: address
        ? {
            address,
            sol: sol.status === "fulfilled" ? sol.value : 0,
            ansemBase: ansem.status === "fulfilled" ? ansem.value : 0,
            clawBase: claw.status === "fulfilled" ? claw.value : 0,
            projectBase: project.status === "fulfilled" ? project.value : 0,
          }
        : null,
      pending: subs.map((s) => ({ ...s, task: taskMap.get(s.taskId || "") || null })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load admin view" }, { status: 500 });
  }
}
