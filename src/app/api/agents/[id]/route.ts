import { NextRequest, NextResponse } from "next/server";
import { getAgent, deleteAgent } from "@/lib/clawpump";
import { getRequestUser, getUserClawpumpApiKey } from "@/lib/auth-session";
import { db } from "@/db/client";
import { agents as agentsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getRequestUser(request);
    const userApiKey = await getUserClawpumpApiKey(user?.id);
    const agent = await getAgent(id, userApiKey);
    return NextResponse.json(agent);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Agent not found", detail: error.message },
      { status: 404 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Auth required" }, { status: 401 });
    }
    const userApiKey = await getUserClawpumpApiKey(user.id);
    await deleteAgent(id, userApiKey);
    try {
      await db
        .delete(agentsTable)
        .where(eq(agentsTable.clawpumpAgentId, id));
    } catch {
      // DB record may not exist
    }
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete", detail: error.message },
      { status: 500 }
    );
  }
}
