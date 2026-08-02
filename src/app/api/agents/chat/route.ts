import { NextRequest, NextResponse } from "next/server";
import { chatWithAgent } from "@/lib/clawpump";
import { getRequestUser, getUserClawpumpApiKey } from "@/lib/auth-session";

export async function POST(request: NextRequest) {
  try {
    const { agentId, message } = await request.json();
    if (!agentId || !message) {
      return NextResponse.json(
        { error: "agentId and message are required" },
        { status: 400 }
      );
    }
    const user = await getRequestUser(request);
    const userApiKey = await getUserClawpumpApiKey(user?.id);
    const result = await chatWithAgent(agentId, message, userApiKey);
    return NextResponse.json(result);
  } catch (error: any) {
    const msg = error.message || "";
    const status = msg.includes("401") || msg.includes("403")
      ? 401
      : msg.includes("404")
        ? 404
        : 500;
    return NextResponse.json(
      { error: "Failed to chat with agent", detail: msg },
      { status }
    );
  }
}
