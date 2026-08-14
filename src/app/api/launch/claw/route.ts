import { NextRequest, NextResponse } from "next/server";
import { launchTokenGasless, launchTokenSelfFunded, listAgents } from "@/lib/clawpump";
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
    const { mode, agentId, name, symbol, description, imageUrl, twitter, website, devBuy } = body;

    if (mode !== "gasless" && mode !== "self-funded") {
      return NextResponse.json(
        { error: "mode must be 'gasless' or 'self-funded'" },
        { status: 400 }
      );
    }
    if (!agentId) {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 });
    }
    if (!symbol || !description) {
      return NextResponse.json(
        { error: "symbol and description are required" },
        { status: 400 }
      );
    }
    if (mode === "self-funded" && !name) {
      return NextResponse.json({ error: "name is required for self-funded launches" }, { status: 400 });
    }

    const userApiKey = await getUserClawpumpApiKey(user.id);
    if (!userApiKey) {
      return NextResponse.json(
        {
          error:
            "Connect your own ClawPump API key in Settings → Accounts first, then launch tokens.",
        },
        { status: 400 }
      );
    }

    // Validate the agent belongs to the connected key before launching
    const owned = await listAgents(userApiKey, { fresh: true });
    const ownedAgents = owned || [];
    const agent = ownedAgents.find((a: any) => a.id === agentId);
    if (!agent) {
      return NextResponse.json(
        {
          error:
            "This API key does not own the specified agent. Pick one of your agents from the dropdown (they are loaded from your connected ClawPump key).",
        },
        { status: 403 }
      );
    }

    const common = {
      symbol: symbol.toUpperCase().slice(0, 12),
      description,
      imageUrl: imageUrl || undefined,
      devBuy: devBuy || undefined,
    };

    const result =
      mode === "gasless"
        ? await launchTokenGasless(
            {
              ...common,
              name: name || undefined,
              agentId,
              twitter: twitter || undefined,
              website: website || undefined,
            },
            userApiKey
          )
        : await launchTokenSelfFunded(
            {
              name,
              ...common,
              agentId,
              agentName: agent.name,
              walletAddress: agent.walletAddress || undefined,
            },
            userApiKey
          );

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    const msg = error.message || "Failed to launch token";
    const status = msg.includes("401")
      ? 401
      : msg.includes("403") || msg.includes("not own")
      ? 403
      : msg.includes("Payment required") || msg.includes("fund")
      ? 400
      : msg.includes("404") || msg.includes("not found")
      ? 404
      : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
