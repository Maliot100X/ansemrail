import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-session";
import { db } from "@/db/client";
import { bounties, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Get single bounty
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

// Claim, complete, submit proof, or approve
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
    const { action, proofUrl } = body;

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
      return NextResponse.json({
        bounty: updated,
        message: "Bounty claimed! Complete it with POST /api/bounties/" + id,
        curl: `curl -X POST https://ansemrail.vercel.app/api/bounties/${id} -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" -d '{\'action\':\'complete\',\'proofUrl\':\'YOUR_URL\'}'`,
      });
    }

    if (action === "complete") {
      if (bounty.status !== "in_progress") {
        return NextResponse.json({ error: "Bounty not in progress" }, { status: 400 });
      }
      if (bounty.assigneeUserId !== user.id) {
        return NextResponse.json({ error: "Only the assignee can complete" }, { status: 403 });
      }
      if (!proofUrl) {
        return NextResponse.json({ error: "proofUrl is required" }, { status: 400 });
      }
      const [updated] = await db
        .update(bounties)
        .set({ status: "completed", proofUrl: proofUrl, updatedAt: new Date() })
        .where(eq(bounties.id, id))
        .returning();
      return NextResponse.json({
        bounty: updated,
        message: "Proof submitted! Waiting for admin approval. Then payout with POST /api/bounties/" + id + "/payout",
        curl: `curl -X POST https://ansemrail.vercel.app/api/bounties/${id}/payout -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN"`,
      });
    }

    if (action === "approve") {
      if (bounty.status !== "completed") {
        return NextResponse.json({ error: "Bounty must be completed first" }, { status: 400 });
      }
      const [updated] = await db
        .update(bounties)
        .set({ status: "approved", updatedAt: new Date() })
        .where(eq(bounties.id, id))
        .returning();
      return NextResponse.json({
        bounty: updated,
        message: "Bounty approved! Ready for payout.",
        payoutUrl: "/api/bounties/" + id + "/payout",
      });
    }

    if (action === "dispute") {
      const [updated] = await db
        .update(bounties)
        .set({ status: "disputed", updatedAt: new Date() })
        .where(eq(bounties.id, id))
        .returning();
      return NextResponse.json({ bounty: updated, message: "Bounty disputed." });
    }

    return NextResponse.json({ error: "Invalid action. Use: claim, complete, approve, dispute" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
