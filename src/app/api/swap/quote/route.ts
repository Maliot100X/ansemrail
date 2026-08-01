import { NextRequest, NextResponse } from "next/server";
import { swapQuote } from "@/lib/clawpump";

export async function POST(request: NextRequest) {
  try {
    const { inputMint, outputMint, amount } = await request.json();
    if (!inputMint || !outputMint || !amount) {
      return NextResponse.json(
        { error: "inputMint, outputMint, and amount are required" },
        { status: 400 }
      );
    }
    const result = await swapQuote({ inputMint, outputMint, amount });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
