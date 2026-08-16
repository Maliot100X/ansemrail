import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth-session";
import { db } from "@/db/client";
import { x402Payments } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// x402 Payment Gateway info and history
export async function GET(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get("action") || "info";

    if (action === "info") {
      return NextResponse.json({
        protocol: "x402",
        description: "Internet-native payments — no accounts, no API keys, no friction",
        supportedTokens: ["SOL", "USDC", "ANSEM", "CLAW"],
        pricePerCall: {
          "/api/swap/quote": "0.0001 SOL",
          "/api/swap/execute": "0.0005 SOL",
          "/api/launch/claw": "0.001 SOL",
          "/api/launch/pons": "0.001 SOL",
          "/api/agents/chat": "0.0001 SOL",
        },
        network: "Solana mainnet-beta",
        docs: "https://x402.org",
        note: "x402 lets agents pay per HTTP request. Server responds HTTP 402 when payment required, agent pays instantly with stablecoins, gets access. Zero protocol fees.",
      });
    }

    if (action === "history") {
      const user = await getRequestUser(request);
      if (!user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
      }
      const payments = await db
        .select()
        .from(x402Payments)
        .where(eq(x402Payments.userId, user.id))
        .orderBy(desc(x402Payments.createdAt))
        .limit(50);

      return NextResponse.json({ payments });
    }

    if (action === "stats") {
      const [totalPayments] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(x402Payments);
      const [totalVolume] = await db
        .select({ total: sql<string>`coalesce(sum(amount::numeric), 0)::text` })
        .from(x402Payments)
        .where(eq(x402Payments.status, "confirmed"));

      return NextResponse.json({
        totalPayments: totalPayments?.count || 0,
        totalVolume: totalVolume?.total || "0",
        network: "Solana mainnet-beta",
        protocol: "x402",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Record a payment
export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { payerAddress, payeeAddress, amount, token, endpoint, txSignature } = body;

    if (!payerAddress || !amount || !endpoint) {
      return NextResponse.json(
        { error: "payerAddress, amount, and endpoint are required" },
        { status: 400 }
      );
    }

    const [payment] = await db
      .insert(x402Payments)
      .values({
        userId: user.id,
        payerAddress,
        payeeAddress: payeeAddress || process.env.TREASURY_WALLET_ADDRESS || null,
        amount: String(amount),
        token: token || "SOL",
        endpoint,
        txSignature: txSignature || null,
        status: txSignature ? "confirmed" : "pending",
      })
      .returning();

    return NextResponse.json({
      payment,
      message: "Payment recorded via x402 protocol",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
