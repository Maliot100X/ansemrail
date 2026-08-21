import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-session";
import { db } from "@/db/client";
import { bounties, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { sendSplReward, ANSEM_MINT, CLAW_MINT, PROJECT_MINT, getTreasuryKeypair, treasureWalletAddress } from "@/lib/rewards";
import { sendMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

const TOKEN_MINTS: Record<string, string> = {
  ANSEM: ANSEM_MINT,
  CLAW: CLAW_MINT,
  CLAWRENA: PROJECT_MINT,
  PROJECT: PROJECT_MINT,
};

function authorized(request: NextRequest): boolean {
  const secret = process.env.REWARDS_ADMIN_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

// List bounties
export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status") || "open";

    let query = db
      .select({
        id: bounties.id,
        title: bounties.title,
        description: bounties.description,
        rewardToken: bounties.rewardToken,
        rewardAmount: bounties.rewardAmount,
        status: bounties.status,
        deliverable: bounties.deliverable,
        proofUrl: bounties.proofUrl,
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
    if (!["ANSEM", "CLAW", "CLAWRENA", "PROJECT", "SOL"].includes((rewardToken || "ANSEM").toUpperCase())) {
      return NextResponse.json({ error: "Unsupported reward token" }, { status: 400 });
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
      message: "Bounty created.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete bounty (admin only) or close own bounty
export async function DELETE(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    const isAdmin = authorized(request);
    if (!user && !isAdmin) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const [bounty] = await db.select().from(bounties).where(eq(bounties.id, id)).limit(1);
    if (!bounty) return NextResponse.json({ error: "Bounty not found" }, { status: 404 });

    if (!isAdmin && bounty.creatorUserId !== user?.id) {
      return NextResponse.json({ error: "Only the creator or admin can delete" }, { status: 403 });
    }

    await db.delete(bounties).where(eq(bounties.id, id));
    return NextResponse.json({ ok: true, message: "Bounty deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
