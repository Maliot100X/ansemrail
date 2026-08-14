import { NextRequest, NextResponse } from "next/server";
import { stopAgent } from "@/lib/clawpump";
import { getRequestUser, getUserClawpumpApiKey } from "@/lib/auth-session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const userApiKey = await getUserClawpumpApiKey(user.id);
    if (!userApiKey) {
      return NextResponse.json(
        {
          error:
            "Connect your own ClawPump API key in Settings → Accounts first, then control agents.",
        },
        { status: 400 }
      );
    }
    const agent = await stopAgent(id, userApiKey);
    return NextResponse.json(agent);
  } catch (error: any) {
    const msg = error.message || "Failed to stop agent";
    const status = msg.includes("403") ? 403 : msg.includes("401") ? 401 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
