import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, getUserClawpumpApiKey } from "@/lib/auth-session";

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }

    const body = await request.json();
    const { agentId, inputMint, outputMint, amount, slippageBps } = body;

    if (!inputMint || !outputMint || !amount) {
      return NextResponse.json(
        { error: "inputMint, outputMint, and amount are required" },
        { status: 400 }
      );
    }

    const userApiKey = await getUserClawpumpApiKey(user.id);

    // Get a real Jupiter quote through ClawPump
    const quoteRes = await fetch("https://clawpump.tech/api/v1/swap/quote", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userApiKey || ""}`,
      },
      body: JSON.stringify({
        input_mint: inputMint,
        output_mint: outputMint,
        amount,
        slippage_bps: slippageBps || 50,
      }),
    });

    if (!quoteRes.ok) {
      const err = await quoteRes.text();
      return NextResponse.json(
        { error: "Quote failed", detail: err },
        { status: 400 }
      );
    }

    const quote = await quoteRes.json();

    return NextResponse.json({
      status: "quoted",
      quote,
      agentId,
      message:
        "Quote generated. Sign and send from your wallet or PayBox credential to execute.",
      inputMint,
      outputMint,
      amount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Swap execute failed", detail: error.message },
      { status: 500 }
    );
  }
}
