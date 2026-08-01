import { NextRequest, NextResponse } from "next/server";
import { listAgents, createAgent, deleteAgent } from "@/lib/clawpump";

export async function GET() {
  try {
    const agents = await listAgents();
    return NextResponse.json({ agents });
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
    const agent = await createAgent(body);
    return NextResponse.json(agent, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Agent id required" }, { status: 400 });
    }
    await deleteAgent(id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
