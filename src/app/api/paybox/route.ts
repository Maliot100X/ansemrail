import { NextRequest, NextResponse } from "next/server";
import {
  listPayBoxTools,
  listPayBoxVaults,
  createPayBoxVault,
  getPayBoxBalance,
  signWithPayBox,
  createPayBoxPolicy,
  listPayBoxPolicies,
  buildAnsemPayBoxPolicy,
  buildSpendLimitPayBoxPolicy,
} from "@/lib/paybox";

export async function GET(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get("action");
    const token = request.nextUrl.searchParams.get("token") || undefined;

    switch (action) {
      case "tools": {
        const tools = await listPayBoxTools(token);
        return NextResponse.json({ tools });
      }
      case "vaults": {
        const vaults = await listPayBoxVaults(token);
        return NextResponse.json({ vaults });
      }
      case "policies": {
        const policies = await listPayBoxPolicies(token);
        return NextResponse.json({ policies });
      }
      case "balance": {
        const vaultId = request.nextUrl.searchParams.get("vaultId");
        if (!vaultId) {
          return NextResponse.json(
            { error: "vaultId is required for balance action" },
            { status: 400 }
          );
        }
        const balance = await getPayBoxBalance(vaultId, token);
        return NextResponse.json(balance);
      }
      default:
        return NextResponse.json({
          status: "PayBox MCP endpoint",
          actions: ["tools", "vaults", "policies", "balance"],
          message: "Use POST to create vaults, sign, send, or create policies",
        });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, token, ...params } = body;

    switch (action) {
      case "createVault": {
        const vault = await createPayBoxVault(
          params.name,
          params.passphrase,
          token
        );
        return NextResponse.json(vault, { status: 201 });
      }
      case "sign": {
        const result = await signWithPayBox(
          params.vaultId,
          params.message,
          params.passphrase,
          token
        );
        return NextResponse.json(result);
      }
      case "createPolicy": {
        const policy = await createPayBoxPolicy(params.policy, token);
        return NextResponse.json(policy, { status: 201 });
      }
      case "createAnsemPolicy": {
        const policy = await createPayBoxPolicy(buildAnsemPayBoxPolicy(), token);
        return NextResponse.json(policy, { status: 201 });
      }
      case "createSpendLimit": {
        const policy = await createPayBoxPolicy(
          buildSpendLimitPayBoxPolicy(params.maxPerTx, params.maxPerDay),
          token
        );
        return NextResponse.json(policy, { status: 201 });
      }
      default:
        return NextResponse.json(
          {
            error: "Unknown action",
            availableActions: [
              "createVault",
              "sign",
              "createPolicy",
              "createAnsemPolicy",
              "createSpendLimit",
            ],
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
