import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, getUserClawpumpApiKey } from "@/lib/auth-session";

const CLAWPUMP_MCP_URL = "https://mcp.clawpump.tech/mcp";
const FREE_TIER_LIMIT = 1000;
const FREE_TIER_DOCS = "https://clawpump.tech/docs";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  const userKey = await getUserClawpumpApiKey(user?.id);

  let mcpStatus: any = null;
  if (userKey) {
    try {
      const res = await fetch(CLAWPUMP_MCP_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userKey}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "get_free_tier_status", arguments: {} },
        }),
      });
      const data = await res.json();
      if (data?.result) {
        mcpStatus = data.result;
      } else if (data?.error) {
        mcpStatus = { error: data.error };
      } else {
        mcpStatus = { error: "Unexpected response from ClawPump MCP" };
      }
    } catch (error: any) {
      mcpStatus = { error: error.message };
    }
  }

  return NextResponse.json({
    provider: "clawpump",
    connected: !!userKey,
    freeTier: {
      limit: FREE_TIER_LIMIT,
      unit: "messages/day",
      sharedGlobally: true,
      source: FREE_TIER_DOCS,
    },
    mcpStatus,
    message: userKey
      ? "Your own ClawPump key is connected — chat is billed against your key, not the shared free pool."
      : `No ClawPump key connected. Connect your own cpk_ key in Settings → Accounts to use chat, agents, and swaps. ClawPump free tier is ${FREE_TIER_LIMIT} messages/day shared globally across all free-tier users (${FREE_TIER_DOCS}); when exhausted, chat returns 402.`,
  });
}
