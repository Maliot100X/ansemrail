import { NextRequest, NextResponse } from "next/server";
import { listAgents, createAgent, deleteAgent } from "@/lib/clawpump";
import { getRequestUser, getUserClawpumpApiKey } from "@/lib/auth-session";
import { db } from "@/db/client";
import { agents as agentsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_SKILLS = [
  "trading",
  "perps",
  "sniper",
  "market-intelligence",
];

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    const userApiKey = await getUserClawpumpApiKey(user?.id);
    if (!userApiKey) {
      return NextResponse.json({
        agents: [],
        requiresKey: true,
        message:
          "Connect your own ClawPump API key in Settings → Accounts to load your agents.",
      });
    }
    const [clawpumpAgents, dbAgents] = await Promise.all([
      listAgents(userApiKey),
      db.select().from(agentsTable),
    ]);

    const dbByClawpumpId = new Map(
      dbAgents
        .filter((a) => a.clawpumpAgentId)
        .map((a) => [a.clawpumpAgentId as string, a])
    );

    const merged = clawpumpAgents.map((a) => {
      const dbAgent = dbByClawpumpId.get(a.id);
      return {
        ...a,
        userId: dbAgent?.userId ?? null,
        isPublic: dbAgent ? dbAgent.isPublic : true,
      };
    });

    return NextResponse.json({ agents: merged });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to list agents", detail: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const userApiKey = await getUserClawpumpApiKey(user.id);
    if (!userApiKey) {
      return NextResponse.json(
        {
          error:
            "Connect your own ClawPump API key in Settings → Accounts first, then create agents.",
        },
        { status: 400 }
      );
    }
    const body = await request.json();
    const skills =
      Array.isArray(body.skills) && body.skills.length > 0
        ? body.skills
        : DEFAULT_SKILLS;

    const agent = await createAgent(
      { ...body, skills },
      userApiKey
    );

    await db
      .insert(agentsTable)
      .values({
        userId: user.id,
        clawpumpAgentId: agent.id,
        name: agent.name,
        persona: agent.persona || body.persona || null,
        model: agent.model || body.model || null,
        skills,
        isPublic: false,
        status: "stopped",
      })
      .returning();

    return NextResponse.json(
      { ...agent, userId: user.id, isPublic: false, skills },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create agent", detail: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Agent id required" }, { status: 400 });
    }
    const userApiKey = await getUserClawpumpApiKey(user.id);
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
      { error: "Failed to delete agent", detail: error.message },
      { status: 500 }
    );
  }
}
