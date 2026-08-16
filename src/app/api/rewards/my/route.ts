import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { rewardSubmissions, rewardPayments, rewardTasks } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { getRequestUser } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const [subs, payments] = await Promise.all([
      db
        .select()
        .from(rewardSubmissions)
        .where(eq(rewardSubmissions.userId, user.id))
        .orderBy(desc(rewardSubmissions.createdAt)),
      db
        .select()
        .from(rewardPayments)
        .where(eq(rewardPayments.userId, user.id))
        .orderBy(desc(rewardPayments.createdAt)),
    ]);

    const taskIds = [...new Set([...subs.map((s) => s.taskId), ...payments.map((p) => p.taskId)])].filter(Boolean) as string[];
    const tasks = taskIds.length
      ? await db.select().from(rewardTasks).where(inArray(rewardTasks.id, taskIds))
      : [];

    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    return NextResponse.json({
      submissions: subs.map((s) => ({ ...s, task: taskMap.get(s.taskId || "") || null })),
      payments: payments.map((p) => ({ ...p, task: taskMap.get(p.taskId || "") || null })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load your rewards" }, { status: 500 });
  }
}
