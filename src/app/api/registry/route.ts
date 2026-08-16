import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-session";
import { db } from "@/db/client";
import { agentReputation, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Get reputation for a user or list all
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (userId) {
      const [rep] = await db
        .select()
        .from(agentReputation)
        .where(eq(agentReputation.userId, userId))
        .limit(1);
      if (!rep) {
        return NextResponse.json({ reputation: null, message: "No reputation record yet" });
      }
      return NextResponse.json({ reputation: rep });
    }

    // List all reputations ranked by score
    const all = await db
      .select({
        id: agentReputation.id,
        userId: agentReputation.userId,
        trustTier: agentReputation.trustTier,
        reputationScore: agentReputation.reputationScore,
        totalTrades: agentReputation.totalTrades,
        successfulTrades: agentReputation.successfulTrades,
        totalLaunches: agentReputation.totalLaunches,
        totalBounties: agentReputation.totalBounties,
        completedBounties: agentReputation.completedBounties,
        twitterVerified: agentReputation.twitterVerified,
        createdAt: agentReputation.createdAt,
        email: users.email,
      })
      .from(agentReputation)
      .leftJoin(users, eq(agentReputation.userId, users.id))
      .orderBy(desc(agentReputation.reputationScore))
      .limit(100);

    return NextResponse.json({ agents: all });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Register or update reputation
export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "register") {
      // Register agent on AnsemRail reputation system
      const [existing] = await db
        .select()
        .from(agentReputation)
        .where(eq(agentReputation.userId, user.id))
        .limit(1);

      if (existing) {
        return NextResponse.json({ reputation: existing, message: "Already registered" });
      }

      // Check if user is twitter verified
      const [dbUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      const encKeys = (dbUser?.encryptedKeys as any) || {};

      const [rep] = await db
        .insert(agentReputation)
        .values({
          userId: user.id,
          trustTier: "bronze",
          reputationScore: 10,
          twitterVerified: !!encKeys.twitterVerified,
        })
        .returning();

      return NextResponse.json({
        reputation: rep,
        message: "Agent registered in reputation system. Trust tier: Bronze.",
      });
    }

    if (action === "update") {
      const { trades, launches, bountiesCompleted } = body;
      const [existing] = await db
        .select()
        .from(agentReputation)
        .where(eq(agentReputation.userId, user.id))
        .limit(1);

      if (!existing) {
        return NextResponse.json({ error: "Register first with action=register" }, { status: 400 });
      }

      // Calculate new score
      let newScore = existing.reputationScore;
      if (trades) newScore += trades * 5;
      if (launches) newScore += launches * 15;
      if (bountiesCompleted) newScore += bountiesCompleted * 25;

      // Determine trust tier
      let tier = "unrated";
      if (newScore >= 1000) tier = "platinum";
      else if (newScore >= 500) tier = "gold";
      else if (newScore >= 100) tier = "silver";
      else if (newScore >= 10) tier = "bronze";

      const [updated] = await db
        .update(agentReputation)
        .set({
          reputationScore: newScore,
          trustTier: tier,
          totalTrades: existing.totalTrades + (trades || 0),
          totalLaunches: existing.totalLaunches + (launches || 0),
          completedBounties: existing.completedBounties + (bountiesCompleted || 0),
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(agentReputation.userId, user.id))
        .returning();

      return NextResponse.json({ reputation: updated });
    }

    return NextResponse.json({ error: "Invalid action. Use: register, update" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
