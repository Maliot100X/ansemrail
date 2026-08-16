import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-session";
import { db } from "@/db/client";
import { bounties, users } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// List bounties
export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status") || "open";
    const my = request.nextUrl.searchParams.get("my") === "true";

    let query = db
      .select({
        id: bounties.id,
        title: bounties.title,
        description: bounties.description,
        rewardToken: bounties.rewardToken,
        rewardAmount: bounties.rewardAmount,
        status: bounties.status,
        deliverable: bounties.deliverable,
        deadline: bounties.deadline,
        creatorUserId: bounties.creatorUserId,
        assigneeUserId: bounties.assigneeUserId,
        createdAt: bounties.createdAt,
        creatorEmail: users.email,
      })
      .from(bounties)
      .leftJoin(users, eq(bounties.creatorUserId, users.id))
      .orderBy(desc(bounties.createdAt))
      .limit(100);

    if (status !== "all") {
      query = query.where(eq(bounties.status, status)) as typeof query;
    }

    const rows = await query;
    return NextResponse.json({ bounties: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create a bounty
export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, rewardToken, rewardAmount, deliverable, deadline } = body;

    if (!title || !description || !rewardAmount) {
      return NextResponse.json(
        { error: "title, description, and rewardAmount are required" },
        { status: 400 }
      );
    }

    const [bounty] = await db
      .insert(bounties)
      .values({
        creatorUserId: user.id,
        title,
        description,
        rewardToken: rewardToken || "ANSEM",
        rewardAmount: String(rewardAmount),
        deliverable: deliverable || null,
        deadline: deadline ? new Date(deadline) : null,
        status: "open",
      })
      .returning();

    return NextResponse.json({
      bounty,
      message: "Bounty created. Funds should be escrowed to the bounty wallet.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
