import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { communityPosts } from "@/db/schema";
import { getRequestUser } from "@/lib/auth-session";
import { ensureCommunityTables } from "@/lib/community";

export const dynamic = "force-dynamic";

function isAdmin(request: NextRequest): boolean {
  const secret = process.env.REWARDS_ADMIN_SECRET;
  return !!secret && request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureCommunityTables();
    const { id } = await params;
    const user = await getRequestUser(request);
    if (!user && !isAdmin(request)) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, id)).limit(1);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    if (!isAdmin(request) && post.userId !== user?.id) {
      return NextResponse.json({ error: "Only the author or admin can delete this post" }, { status: 403 });
    }

    await db.delete(communityPosts).where(eq(communityPosts.id, id));
    return NextResponse.json({ ok: true, message: "Post deleted." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete post" }, { status: 500 });
  }
}
