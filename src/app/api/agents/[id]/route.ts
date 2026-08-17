import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, getUserClawpumpApiKey } from "@/lib/auth-session";
import { db } from "@/db/client";
import { agents as agentsTable, users, agentReputation } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Try local users table (platform-registered agents/humans)
    const [localUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (localUser) {
      const encKeys = (localUser.encryptedKeys as any) || {};
      const twitterVerified = !!encKeys.twitterVerified;
      const twitterHandle = encKeys.twitterHandle || null;
      const hasClawpumpKey = !!localUser.clawpumpApiKey;

      const [rep] = await db
        .select()
        .from(agentReputation)
        .where(eq(agentReputation.userId, localUser.id))
        .limit(1);

      return NextResponse.json({
        id: localUser.id,
        name: localUser.email || "AnsemRail Agent",
        type: localUser.type,
        status: "active",
        walletAddress: localUser.payoutWallet || null,
        twitterVerified,
        twitterHandle,
        hasClawpumpKey,
        payoutWallet: localUser.payoutWallet || null,
        reputation: rep
          ? {
              trustTier: rep.trustTier,
              score: rep.reputationScore,
              totalTrades: rep.totalTrades,
              totalLaunches: rep.totalLaunches,
            }
          : null,
        createdAt: localUser.createdAt,
        source: "ansemrail",
      });
    }

    // 2. Try local agents table
    const [localAgent] = await db
      .select()
      .from(agentsTable)
      .where(
        or(eq(agentsTable.id, id), eq(agentsTable.clawpumpAgentId, id))
      )
      .limit(1);

    if (localAgent) {
      const [agentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, localAgent.userId || ""))
        .limit(1);

      return NextResponse.json({
        id: localAgent.id,
        clawpumpAgentId: localAgent.clawpumpAgentId,
        name: localAgent.name,
        persona: localAgent.persona,
        model: localAgent.model,
        status: localAgent.status,
        walletAddress: localAgent.walletAddress,
        skills: localAgent.skills,
        isPublic: localAgent.isPublic,
        avatarUrl: localAgent.avatarUrl,
        userId: localAgent.userId,
        userEmail: agentUser?.email || null,
        createdAt: localAgent.createdAt,
        source: "ansemrail",
      });
    }

    // Not found — ClawPump agents are private to their owner
    return NextResponse.json(
      { error: "Agent not found" },
      { status: 404 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Agent not found", detail: error.message },
      { status: 404 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }
    const userApiKey = await getUserClawpumpApiKey(user.id);
    const { deleteAgent } = await import("@/lib/clawpump");
    await deleteAgent(id, userApiKey);
    try {
      await db
        .delete(agentsTable)
        .where(eq(agentsTable.clawpumpAgentId, id));
    } catch {
      // DB record may not exist
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete", detail: error.message },
      { status: 500 }
    );
  }
}
