import { NextRequest, NextResponse } from "next/server";
import {
  ANSEM_MINT,
  CLAW_MINT,
  PROJECT_MINT,
  treasuryConfigStatus,
  saveTreasuryConfig,
  clearTreasuryConfig,
  getTreasurySolBalance,
  getWalletHolding,
} from "@/lib/rewards";

export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const secret = process.env.REWARDS_ADMIN_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  try {
    if (!authorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const status = await treasuryConfigStatus();
    let balances = null;
    if (status.address) {
      const [ansem, claw, project, sol] = await Promise.allSettled([
        getWalletHolding(status.address, ANSEM_MINT),
        getWalletHolding(status.address, CLAW_MINT),
        getWalletHolding(status.address, PROJECT_MINT),
        getTreasurySolBalance(status.address),
      ]);
      balances = {
        sol: sol.status === "fulfilled" ? sol.value : 0,
        ansemBase: ansem.status === "fulfilled" ? ansem.value : 0,
        clawBase: claw.status === "fulfilled" ? claw.value : 0,
        projectBase: project.status === "fulfilled" ? project.value : 0,
      };
    }
    return NextResponse.json({
      configured: status.source !== "none",
      source: status.source,
      hasKey: status.hasKey,
      address: status.address,
      balances,
      note: "Set your own treasury wallet below — the private key is encrypted and never returned.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load treasury config" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!authorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    if (body.clear) {
      await clearTreasuryConfig();
      return NextResponse.json({ ok: true, message: "Treasury config cleared." });
    }
    const privateKey = String(body.privateKey || "").trim();
    if (!privateKey) {
      return NextResponse.json({ error: "privateKey is required (base58 secret key)" }, { status: 400 });
    }
    const { address } = await saveTreasuryConfig(privateKey);
    return NextResponse.json({
      ok: true,
      address,
      message: `Treasury wallet set: ${address}. Fund it with reward tokens, then approve submissions to pay out.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save treasury" }, { status: 500 });
  }
}
