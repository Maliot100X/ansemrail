import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-session";
import { db } from "@/db/client";
import { bounties, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [bounty] = await db.select().from(bounties).where(eq(bounties.id, id)).limit(1);
    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }
    return NextResponse.json({ bounty });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { action, proofUrl, payoutWallet } = body;

    const [bounty] = await db.select().from(bounties).where(eq(bounties.id, id)).limit(1);
    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }

    if (action === "claim") {
      if (bounty.status !== "open") {
        return NextResponse.json({ error: "Bounty is not open" }, { status: 400 });
      }
      const [updated] = await db
        .update(bounties)
        .set({ assigneeUserId: user.id, status: "in_progress", updatedAt: new Date() })
        .where(eq(bounties.id, id))
        .returning();
      return NextResponse.json({ bounty: updated, message: "Bounty claimed!" });
    }

    if (action === "complete") {
      if (bounty.status !== "in_progress") {
        return NextResponse.json({ error: "Bounty not in progress" }, { status: 400 });
      }
      if (bounty.assigneeUserId !== user.id) {
        return NextResponse.json({ error: "Only the assignee can complete" }, { status: 403 });
      }
      if (!payoutWallet) {
        return NextResponse.json({ error: "Payout wallet address is required" }, { status: 400 });
      }
      // Save payout wallet to user profile
      await db
        .update(users)
        .set({ payoutWallet, updatedAt: new Date() })
        .where(eq(users.id, user.id));
      const [updated] = await db
        .update(bounties)
        .set({ status: "completed", proofUrl: proofUrl || null, updatedAt: new Date() })
        .where(eq(bounties.id, id))
        .returning();
      return NextResponse.json({ bounty: updated, message: "Bounty completed!" });
    }

    if (action === "dispute") {
      const [updated] = await db
        .update(bounties)
        .set({ status: "disputed", updatedAt: new Date() })
        .where(eq(bounties.id, id))
        .returning();
      return NextResponse.json({ bounty: updated, message: "Bounty disputed." });
    }

    return NextResponse.json({ error: "Invalid action. Use: claim, complete, dispute" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
