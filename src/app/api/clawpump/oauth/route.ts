import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const agentId = request.nextUrl.searchParams.get("agentId");
  const redirectUri = `${request.nextUrl.origin}/api/clawpump/oauth/callback`;

  const state = JSON.stringify({ agentId, redirectUri });
  const authUrl =
    `https://clawpump.tech/oauth/authorize?` +
    `client_id=${process.env.CLAWPUMP_CLIENT_ID || ""}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&state=${encodeURIComponent(state)}` +
    `&scope=agents:read agents:write swaps:execute`;

  return NextResponse.json({ authUrl, state });
}
