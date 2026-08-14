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
  buildAnsemPayBoxPolicy,
  buildSpendLimitPayBoxPolicy,
} from "@/lib/paybox";
import {
  getRequestUser,
  getUserPayboxApiKey,
  getUserPayboxPolicies,
} from "@/lib/auth-session";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { encryptApiKey, decryptApiKey } from "@/lib/crypto";

async function resolvePayboxToken(
  request: NextRequest,
  bodyToken?: string
): Promise<string | undefined> {
  const urlToken = request.nextUrl.searchParams.get("token") || undefined;
  if (bodyToken) return bodyToken;
  if (urlToken) return urlToken;
  const user = await getRequestUser(request);
  if (user?.id) {
    const userKey = await getUserPayboxApiKey(user.id);
    if (userKey) return userKey;
  }
  return undefined;
}

async function savePolicyForUser(
  userId: string,
  policy: any,
): Promise<void> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const encryptedKeys = (row?.encryptedKeys as Record<string, string>) || {};
  let policies: any[] = [];
  if (encryptedKeys.payboxPolicies) {
    try {
      policies = JSON.parse(decryptApiKey(encryptedKeys.payboxPolicies));
    } catch {
      policies = [];
    }
  }
  policies = (policies || []).filter((p: any) => p?.id !== policy.id);
  policies.push({ ...policy, createdAt: new Date().toISOString() });
  encryptedKeys.payboxPolicies = encryptApiKey(JSON.stringify(policies));
  await db
    .update(users)
    .set({ encryptedKeys, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

const NEEDS_KEY_MSG =
  "Connect your own PayBox API key in Settings → Accounts first, then use PayBox actions.";

export async function GET(request: NextRequest) {
  try {
    const action = request.nextUrl.searchParams.get("action");
    const token = await resolvePayboxToken(request);
    if (!token) {
      return NextResponse.json(
        { error: NEEDS_KEY_MSG },
        { status: 401 }
      );
    }

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
      case "policies": {
        const user = await getRequestUser(request);
        if (!user) {
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          );
        }
        const policies = await getUserPayboxPolicies(user.id);
        return NextResponse.json({ policies });
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
    const { action, token: bodyToken, ...params } = body;
    const token = await resolvePayboxToken(request, bodyToken);
    if (!token) {
      return NextResponse.json(
        { error: NEEDS_KEY_MSG },
        { status: 401 }
      );
    }

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
      case "createAnsemPolicy": {
        const user = await getRequestUser(request);
        if (!user) {
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          );
        }
        const policy = buildAnsemPayBoxPolicy();
        await savePolicyForUser(user.id, policy);
        let credentials: any[] = [];
        try {
          const creds = await listPayBoxCredentials(token);
          credentials = creds?.credentials || [];
        } catch {
          credentials = [];
        }
        return NextResponse.json({
          created: true,
          policy,
          credentials,
          message:
            "Ansem-Only policy saved to your account. PayBox enforces it via your credential access grants.",
        });
      }
      case "createSpendLimit": {
        const user = await getRequestUser(request);
        if (!user) {
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          );
        }
        const maxPerTx = Number(params.maxPerTx) || 100;
        const maxPerDay = Number(params.maxPerDay) || 1000;
        const policy = buildSpendLimitPayBoxPolicy(maxPerTx, maxPerDay);
        await savePolicyForUser(user.id, policy);
        let credentials: any[] = [];
        try {
          const creds = await listPayBoxCredentials(token);
          credentials = creds?.credentials || [];
        } catch {
          credentials = [];
        }
        return NextResponse.json({
          created: true,
          policy,
          credentials,
          message:
            "Spend-limit policy saved to your account. PayBox enforces it via your credential access grants.",
        });
      }
      case "deletePolicy": {
        const user = await getRequestUser(request);
        if (!user) {
          return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
          );
        }
        const { policyId } = params;
        if (!policyId) {
          return NextResponse.json(
            { error: "policyId is required" },
            { status: 400 }
          );
        }
        const policies = await getUserPayboxPolicies(user.id);
        const remaining = policies.filter((p: any) => p?.id !== policyId);
        const [row] = await db
          .select()
          .from(users)
          .where(eq(users.id, user.id))
          .limit(1);
        const encryptedKeys =
          (row?.encryptedKeys as Record<string, string>) || {};
        encryptedKeys.payboxPolicies = encryptApiKey(
          JSON.stringify(remaining)
        );
        await db
          .update(users)
          .set({ encryptedKeys, updatedAt: new Date() })
          .where(eq(users.id, user.id));
        return NextResponse.json({ deleted: true, remaining });
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
              "createAnsemPolicy",
              "createSpendLimit",
              "deletePolicy",
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
