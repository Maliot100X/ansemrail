import { NextRequest, NextResponse } from "next/server";

const CLAWPUMP_MCP_URL = "https://mcp.clawpump.tech/mcp";

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action") || "tools";

  return NextResponse.json({
    endpoint: CLAWPUMP_MCP_URL,
    action,
    message: "Use POST with JSON-RPC to call ClawPump MCP tools",
    availableActions: ["initialize", "tools/list", "tools/call"],
    note: "ClawPump MCP is OAuth-only — cpk_ API keys are rejected upstream with invalid_token. Use the ClawPump REST API (/api/v1/* via your connected cpk_ key) for agent control, swaps, and launches.",
    oauthOnly: true,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    const res = await fetch(CLAWPUMP_MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
