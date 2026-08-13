import { NextRequest, NextResponse } from "next/server";
import {
  listPayBoxTools,
  listPayBoxCredentials,
  getPayBoxPortfolio,
  requestPayBoxTransfer,
  requestPayBoxSwap,
  signWithPayBox,
  getPayBoxRequest,
  discoverPayBoxServices,
  getPayBoxBuyLink,
  worldFindMarkets,
  worldPositions,
  verifySolanaBalance,
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
      case "credentials":
      case "vaults": {
        const result = await listPayBoxCredentials(token);
        return NextResponse.json(result);
      }
      case "portfolio":
      case "balance": {
        const credentialId = request.nextUrl.searchParams.get("credentialId") || request.nextUrl.searchParams.get("vaultId");
        if (!credentialId) {
          return NextResponse.json(
            { error: "credentialId is required for portfolio action" },
            { status: 400 }
          );
        }
        const portfolio = await getPayBoxPortfolio(credentialId, token);
        return NextResponse.json(portfolio);
      }
      case "services": {
        const services = await discoverPayBoxServices(token);
        return NextResponse.json({ services });
      }
      case "request": {
        const requestId = request.nextUrl.searchParams.get("requestId");
        if (!requestId) {
          return NextResponse.json(
            { error: "requestId is required for request action" },
            { status: 400 }
          );
        }
        const req = await getPayBoxRequest(requestId, token);
        return NextResponse.json(req);
      }
      case "world-markets": {
        const status = request.nextUrl.searchParams.get("status") || undefined;
        const events = request.nextUrl.searchParams.get("events") === "true";
        const markets = await worldFindMarkets({ events, status }, token);
        return NextResponse.json(markets);
      }
      case "world-positions": {
        const address = request.nextUrl.searchParams.get("address");
        if (!address) {
          return NextResponse.json(
            { error: "address is required for world-positions action" },
            { status: 400 }
          );
        }
        const positions = await worldPositions(address, token);
        return NextResponse.json(positions);
      }
      case "verify-balance": {
        const address = request.nextUrl.searchParams.get("address");
        const tokenMint = request.nextUrl.searchParams.get("tokenMint");
        const txSig = request.nextUrl.searchParams.get("txSignature");
        if (!address || !tokenMint || !txSig) {
          return NextResponse.json(
            { error: "address, tokenMint, and txSignature are required" },
            { status: 400 }
          );
        }
        const result = await verifySolanaBalance(address, tokenMint, txSig, token);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({
          status: "PayBox MCP endpoint",
          url: "https://api.paybox.sh/mcp",
          actions: [
            "tools",
            "credentials",
            "portfolio",
            "services",
            "request",
            "world-markets",
            "world-positions",
            "verify-balance",
          ],
          message: "Use POST to transfer, swap, sign, buy link, or poll requests",
        });
    }
  } catch (error: any) {
    const msg = error.message || "PayBox request failed";
    const status = msg.includes("not reachable") || msg.includes("404") ? 503 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, token, ...params } = body;

    switch (action) {
      case "transfer": {
        const result = await requestPayBoxTransfer(
          params.credentialId,
          params.chain || "solana:mainnet",
          params.to,
          params.amount,
          token,
          params.tokenMint
        );
        return NextResponse.json(result);
      }
      case "swap": {
        const result = await requestPayBoxSwap(
          params.credentialId,
          params.srcChain || "solana:mainnet",
          params.srcToken || "native",
          params.dstToken,
          params.amount,
          token
        );
        return NextResponse.json(result);
      }
      case "sign": {
        const result = await signWithPayBox(
          params.credentialId,
          params.message,
          undefined,
          token
        );
        return NextResponse.json(result);
      }
      case "buyLink": {
        const result = await getPayBoxBuyLink(
          params.credentialId,
          params.chain || "solana:mainnet",
          token
        );
        return NextResponse.json(result);
      }
      case "pollRequest": {
        const result = await getPayBoxRequest(params.requestId, token);
        return NextResponse.json(result);
      }
      case "verifyBalance": {
        const result = await verifySolanaBalance(
          params.address,
          params.tokenMint,
          params.txSignature,
          token
        );
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json(
          {
            error: "Unknown action",
            availableActions: [
              "transfer",
              "swap",
              "sign",
              "buyLink",
              "pollRequest",
              "verifyBalance",
            ],
          },
          { status: 400 }
        );
    }
  } catch (error: any) {
    const msg = error.message || "PayBox request failed";
    const status = msg.includes("not reachable") || msg.includes("404") ? 503 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
