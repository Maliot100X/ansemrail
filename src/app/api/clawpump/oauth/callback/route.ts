import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");

  if (!code) {
    return NextResponse.json({ error: "Authorization code missing" }, { status: 400 });
  }

  let state: { agentId?: string; redirectUri?: string } = {};
  if (stateParam) {
    try {
      state = JSON.parse(stateParam);
    } catch {
      // ignore malformed state
    }
  }

  const tokenRes = await fetch("https://clawpump.tech/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: process.env.CLAWPUMP_CLIENT_ID || "",
      client_secret: process.env.CLAWPUMP_CLIENT_SECRET || "",
      redirect_uri: state.redirectUri || `${request.nextUrl.origin}/api/clawpump/oauth/callback`,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    return NextResponse.json(
      { error: "Token exchange failed", detail: err },
      { status: 400 }
    );
  }

  const tokens = await tokenRes.json();

  return NextResponse.json({
    ok: true,
    agentId: state.agentId || null,
    accessToken: tokens.access_token,
    expiresIn: tokens.expires_in,
    message: "ClawPump OAuth linked. Save this access token for authenticated API calls.",
  });
}
