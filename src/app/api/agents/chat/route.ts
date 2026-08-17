import { NextRequest, NextResponse } from "next/server";
import { checkX402, recordX402Payment } from "@/lib/x402";
import { chatWithAgent } from "@/lib/clawpump";
import { getRequestUser, getUserClawpumpApiKey } from "@/lib/auth-session";
import { db } from "@/db/client";
import { agents as agentsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const x402Response = checkX402(request);
  if (x402Response) return x402Response;
  try {
    const { agentId, message } = await request.json();
    if (!agentId || !message) {
      return NextResponse.json(
        { error: "agentId and message are required" },
        { status: 400 }
      );
    }
    const user = await getRequestUser(request);
    const userApiKey = await getUserClawpumpApiKey(user?.id);
    if (!userApiKey) {
      return NextResponse.json(
        {
          error:
            "Connect your own ClawPump API key in Settings → Accounts first, then chat with agents.",
        },
        { status: 401 }
      );
    }

    // Resolve the real ClawPump agent ID: agentId may be a local DB uuid
    // or a ClawPump agent id. Look up the DB record first.
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
    } catch {
      // Not a valid uuid — assume it's already a ClawPump agent id
    }

    const result = await chatWithAgent(clawpumpAgentId, message, userApiKey);
    return NextResponse.json(result);
  } catch (error: any) {
    const msg = error.message || "";
    let status = 500;
    let userMsg = "Failed to chat with agent";
    if (msg.includes("401") || msg.includes("403")) {
      status = 401;
      userMsg = "Authentication failed. Connect your own ClawPump API key in Settings to get unlimited agent chat.";
    } else if (msg.includes("402") || msg.includes("free_quota") || msg.includes("quota")) {
      status = 402;
      userMsg = "ClawPump free-tier quota (1,000 messages/day shared globally) is exhausted right now. Connect your own ClawPump API key in Settings → Connected Accounts for guaranteed chat.";
    } else if (msg.includes("404")) {
      status = 404;
      userMsg = "Agent not found. It may have been deleted.";
    } else if (msg.includes("429")) {
      status = 429;
      userMsg = "Chat rate limit hit on ClawPump's shared free tier (1,000 messages/day globally). Connect your own ClawPump API key in Settings for guaranteed chat.";
    } else if (msg.includes("500")) {
      userMsg = "ClawPump chat service error. The agent may need to be initialized, or the shared free tier is overloaded. Try connecting your own ClawPump API key in Settings.";
    }
    return NextResponse.json(
      { error: userMsg, detail: msg },
      { status }
    );
  }
}
