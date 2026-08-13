import { NextRequest, NextResponse } from "next/server";
import { launchPonsToken, getPonsLaunches } from "@/lib/clawpump";
import { getRequestUser, getUserClawpumpApiKey } from "@/lib/auth-session";

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Sign in or provide a Bearer token." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { agentId, name, symbol, description, logoUrl, payoutWallet } = body;

    if (!agentId || !name || !symbol || !payoutWallet) {
      return NextResponse.json(
        { error: "agentId, name, symbol, and payoutWallet are required" },
        { status: 400 }
      );
    }

    const userApiKey = await getUserClawpumpApiKey(user.id);

    const result = await launchPonsToken(
      {
        agentId,
        name,
        symbol: symbol.toUpperCase().slice(0, 12),
        description: description || `${name}, launched on Robinhood Chain via ClawPump.`,
        logoUrl: logoUrl || "https://clawpump.tech/claw-token.webp",
        payoutWallet,
      },
      userApiKey
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    const msg = error.message || "Failed to launch PONS token";
    const status = msg.includes("401") || msg.includes("auth")
      ? 401
      : msg.includes("400")
      ? 400
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function GET(request: NextRequest) {
  try {
    const agentId = request.nextUrl.searchParams.get("agentId");
    if (!agentId) {
      return NextResponse.json(
        { error: "agentId query parameter is required" },
        { status: 400 }
      );
    }

    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userApiKey = await getUserClawpumpApiKey(user.id);
    const launches = await getPonsLaunches(agentId, userApiKey);
    return NextResponse.json(launches);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch PONS launches" },
      { status: 500 }
    );
  }
}
