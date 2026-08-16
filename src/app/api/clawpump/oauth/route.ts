import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = process.env.CLAWPUMP_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      {
        error:
          "ClawPump OAuth is not configured yet — add CLAWPUMP_CLIENT_ID (and CLAWPUMP_CLIENT_SECRET) to the Vercel environment, then try again.",
      },
      { status: 400 }
    );
  }
  const agentId = request.nextUrl.searchParams.get("agentId");
  const redirectUri = `${request.nextUrl.origin}/api/clawpump/oauth/callback`;

  const state = JSON.stringify({ agentId, redirectUri });
  const authUrl =
    `https://clawpump.tech/oauth/authorize?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&state=${encodeURIComponent(state)}` +
    `&scope=agents:read agents:write swaps:execute`;

  return NextResponse.json({ authUrl, state });
}
