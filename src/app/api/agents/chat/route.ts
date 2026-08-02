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
    let status = 500;
    let userMsg = "Failed to chat with agent";
    if (msg.includes("401") || msg.includes("403")) {
      status = 401;
      userMsg = "Authentication failed. Connect your own ClawPump API key in Settings to get unlimited agent chat.";
    } else if (msg.includes("404")) {
      status = 404;
      userMsg = "Agent not found. It may have been deleted.";
    } else if (msg.includes("429")) {
      status = 429;
      userMsg = "Chat quota exceeded. Connect your own ClawPump API key in Settings for unlimited chat.";
    } else if (msg.includes("500")) {
      userMsg = "ClawPump chat service error. The agent may need to be initialized or the API key quota is exhausted. Try connecting your own ClawPump API key in Settings.";
    }
    return NextResponse.json(
      { error: userMsg, detail: msg },
      { status }
    );
  }
}
