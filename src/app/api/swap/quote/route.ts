import { NextRequest, NextResponse } from "next/server";
import { checkX402, recordX402Payment } from "@/lib/x402";
import { swapQuote } from "@/lib/clawpump";
import { getRequestUser, getUserClawpumpApiKey } from "@/lib/auth-session";

export async function POST(request: NextRequest) {
  const x402Response = checkX402(request);
  if (x402Response) return x402Response;
  try {
    const { inputMint, outputMint, amount } = await request.json();
    if (!inputMint || !outputMint || !amount) {
      return NextResponse.json(
        { error: "inputMint, outputMint, and amount are required" },
        { status: 400 }
      );
    }
    let userApiKey: string | undefined;
    try {
      const user = await getRequestUser(request);
      if (user) userApiKey = await getUserClawpumpApiKey(user.id);
    } catch {}
    if (!userApiKey) {
      return NextResponse.json(
        {
          error:
            "Connect your own ClawPump API key in Settings → Accounts first, then get swap quotes.",
        },
        { status: 400 }
      );
    }
    const result = await swapQuote({ inputMint, outputMint, amount }, userApiKey);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
