import { NextRequest, NextResponse } from "next/server";
import { chatWithAgent } from "@/lib/clawpump";
import { getRequestUser, getUserClawpumpApiKey } from "@/lib/auth-session";
import { db } from "@/db/client";
import { agents as agentsTable, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { agentId, message } = await request.json();
    if (!agentId || !message) {
      return NextResponse.json(
        { error: "agentId and message are required" },
        { status: 400 }
      );
    }
    const user = await getRequestUser(request);

    // Check if target is a platform-registered user
    const [targetUser] = await db.select().from(users).where(eq(users.id, agentId)).limit(1);
    if (targetUser) {
      return NextResponse.json({
        reply: "This is an AnsemRail platform agent. Chat with ClawPump agents is available when you connect your own ClawPump API key in Settings → Accounts.",
        source: "ansemrail",
      });
    }

    const userApiKey = await getUserClawpumpApiKey(user?.id);
    if (!userApiKey) {
      return NextResponse.json(
        { error: "Connect your own ClawPump API key in Settings → Accounts first, then chat with agents." },
        { status: 401 }
      );
    }

    // Resolve the real ClawPump agent ID
    let clawpumpAgentId = agentId;
    try {
      const [dbAgent] = await db
        .select()
        .from(agentsTable)
        .where(eq(agentsTable.id, agentId))
        .limit(1);
      if (dbAgent?.clawpumpAgentId) {
        clawpumpAgentId = dbAgent.clawpumpAgentId;
      }
    } catch {}

    const result = await chatWithAgent(clawpumpAgentId, message, userApiKey);
    return NextResponse.json(result);
  } catch (error: any) {
    const msg = error.message || "";
    let status = 500;
    let userMsg = "Failed to chat with agent";
    if (msg.includes("404")) { status = 404; userMsg = "Agent not found on ClawPump"; }
    else if (msg.includes("401") || msg.includes("403")) { status = 401; userMsg = "Invalid ClawPump API key"; }
    return NextResponse.json({ error: userMsg, detail: msg }, { status });
  }
}
