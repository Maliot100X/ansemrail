import { NextRequest, NextResponse } from "next/server";
import { chatWithAgent } from "@/lib/clawpump";

export async function POST(request: NextRequest) {
  try {
    const { agentId, message } = await request.json();
    if (!agentId || !message) {
      return NextResponse.json(
        { error: "agentId and message are required" },
        { status: 400 }
      );
    }
    const result = await chatWithAgent(agentId, message);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
