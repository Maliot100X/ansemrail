import { NextRequest, NextResponse } from "next/server";
import { getAgentMessages } from "@/lib/clawpump";
import { getRequestUser, getUserClawpumpApiKey } from "@/lib/auth-session";

export async function GET(
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
            "Connect your own ClawPump API key in Settings → Accounts first, then read agent history.",
        },
        { status: 400 }
      );
    }
    const limit = Number(request.nextUrl.searchParams.get("limit") || 20);
    const data = await getAgentMessages(id, Math.min(Math.max(limit, 1), 100), userApiKey);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch agent messages" },
      { status: 500 }
    );
  }
}
