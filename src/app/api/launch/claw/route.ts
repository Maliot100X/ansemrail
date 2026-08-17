import { NextRequest, NextResponse } from "next/server";
import { checkX402, recordX402Payment } from "@/lib/x402";
import { launchTokenGasless, launchTokenSelfFunded, listAgents } from "@/lib/clawpump";
import { getRequestUser, getUserClawpumpApiKey } from "@/lib/auth-session";

// Serve token images from our own domain so ClawPump's image validation
// (which blocks abuse-prone hosts like postimg.cc) accepts them.
function proxyImageUrl(url: string | undefined, origin: string): string | undefined {
  if (!url) return undefined;
  if (!/^https?:\/\//i.test(url)) return url; // already a path (ClawPump avatar) — leave as-is
  const encoded = Buffer.from(url).toString("base64url");
  return `${origin}/api/image-proxy?u=${encoded}`;
}

export async function POST(request: NextRequest) {
  const x402Response = checkX402(request);
  if (x402Response) return x402Response;
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
    if (mode === "self-funded") {
      if (!name) {
        return NextResponse.json(
          { error: "name is required for self-funded launches" },
          { status: 400 }
        );
      }
      if (!imageUrl) {
        return NextResponse.json(
          { error: "imageUrl is required for self-funded launches" },
          { status: 400 }
        );
      }
      if ((description || "").trim().length < 20) {
        return NextResponse.json(
          { error: "description must be at least 20 characters for self-funded launches" },
          { status: 400 }
        );
      }
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

    const proxiedImage = proxyImageUrl(imageUrl, request.nextUrl.origin);
    const common = {
      symbol: symbol.toUpperCase().slice(0, 12),
      description,
      imageUrl: proxiedImage,
      image_url: proxiedImage,
      network: "solana",
      initialBuySol: devBuy ? Number(devBuy) : undefined,
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
    let status = msg.includes("401")
      ? 401
      : msg.includes("403") || msg.includes("not own")
      ? 403
      : msg.includes("404") || msg.includes("not found")
      ? 404
      : 500;

    // ClawPump returns structured error bodies — classify the real cause
    if (error?.body && typeof error.body === "object") {
      const body = error.body;
      const text = `${body.error || ""} ${body.token_launch?.error || ""} ${body.token_launch?.details?.message || ""}`.toLowerCase();

      // Image rejection: blocked / abuse-prone / generated image hosts
      if (
        text.includes("image") &&
        (text.includes("blocked") || text.includes("abuse") || text.includes("generated") || text.includes("upload"))
      ) {
        status = 400;
        return NextResponse.json(
          {
            type: "image_rejected",
            error:
              "ClawPump rejected the token image: " +
              (body.error || "image host is blocked") +
              ". Use a real PNG/JPEG/WebP image from a normal host — abuse-prone image hosts are blocked. Our platform proxies images through its own domain automatically.",
          },
          { status }
        );
      }

      // Genuine funding guidance (402 needs_funding / Payment required)
      const isFunding =
        !!body.selfFunded ||
        body.code === "MAX_GASLESS_LAUNCHES_PER_USER_EXCEEDED" ||
        body.status === "needs_funding" ||
        body.nextStep === "self_funded" ||
        body.error === "Payment required" ||
        body.error?.includes?.("Payment");
      if (isFunding) {
        status = 400;
        return NextResponse.json({ error: msg, ...body }, { status });
      }

      // Any other structured launch failure — surface the real message
      if (body.token_launch || body.code || body.nextStep) {
        status = 400;
        return NextResponse.json(
          { type: "launch_failed", error: body.error || body.token_launch?.error || msg },
          { status }
        );
      }
    }

    if (msg.includes("400") || msg.includes("Payment required")) status = 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
