import { NextRequest, NextResponse } from "next/server";
import { checkX402, recordX402Payment } from "@/lib/x402";
import { swapExecute, listAgents } from "@/lib/clawpump";
import { getRequestUser, getUserClawpumpApiKey } from "@/lib/auth-session";

export async function POST(request: NextRequest) {
  const x402Response = checkX402(request);
  if (x402Response) return x402Response;
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { agentId, inputMint, outputMint, amount, slippageBps } = body;

    if (!agentId || !inputMint || !outputMint || !amount) {
      return NextResponse.json(
        { error: "agentId, inputMint, outputMint, and amount are required" },
        { status: 400 }
      );
    }

    const userApiKey = await getUserClawpumpApiKey(user.id);
    if (!userApiKey) {
      return NextResponse.json(
        {
          error:
            "Connect your own ClawPump API key in Settings → Accounts first, then execute swaps.",
        },
        { status: 400 }
      );
    }

    // Verify the agent belongs to the connected key before executing
    try {
      const owned = await listAgents(userApiKey, { fresh: true });
      const ownedIds = (owned || []).map((a: any) => a.id);
      if (!ownedIds.includes(agentId)) {
        return NextResponse.json(
          {
            error:
              "This API key does not own the specified agent. Pick one of your agents — they are loaded from your connected ClawPump key.",
            ownedAgents: ownedIds,
          },
          { status: 403 }
        );
      }
    } catch {
      // If ownership check fails, let the upstream call decide
    }

    const result = await swapExecute(
      {
        inputMint,
        outputMint,
        amount,
        agentId,
        slippageBps: slippageBps || 50,
      },
      userApiKey
    );

    return NextResponse.json({
      status: "executed",
      ...result,
      agentId,
      message:
        "Swap executed through your ClawPump agent wallet. Verify the transaction on-chain with the returned signature.",
    });
  } catch (error: any) {
    const msg = error.message || "Swap execution failed";
    const status = msg.includes("403") ? 403 : msg.includes("401") ? 401 : 400;
    return NextResponse.json({ error: msg, detail: msg }, { status });
  }
}
