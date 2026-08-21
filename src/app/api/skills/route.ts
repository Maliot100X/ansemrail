import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { skills } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getRequestUser } from "@/lib/auth-session";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (userId) {
      const userSkills = await db
        .select()
        .from(skills)
        .where(eq(skills.userId, userId));
      return NextResponse.json({ skills: userSkills });
    }
    const allSkills = await db.select().from(skills);
    return NextResponse.json({ skills: allSkills });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch skills", detail: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, skillMdContent, tags, userId } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "name and slug are required" },
        { status: 400 }
      );
    }

    // Resolve the real user server-side (Bearer token or session), falling
    // back to the client-provided userId. This keeps per-user slugs stable.
    const authed = await getRequestUser(request);
    const ownerId = authed?.id || userId || null;
    const finalSlug = ownerId ? `${slug}-${ownerId.slice(0, 8)}` : slug;

    // Idempotent: if this user already installed this skill, return it.
    if (ownerId) {
      const [existing] = await db
        .select()
        .from(skills)
        .where(and(eq(skills.slug, finalSlug), eq(skills.userId, ownerId)))
        .limit(1);
      if (existing) {
        return NextResponse.json({
          skill: existing,
          message: "Skill already installed",
        });
      }
    }

    const [skill] = await db
      .insert(skills)
      .values({
        name,
        slug: finalSlug,
        description: description || null,
        skillMdContent: skillMdContent || null,
        tags: tags || [],
        userId: ownerId,
        installed: true,
      })
      .returning();

    return NextResponse.json(
      { skill, message: "Skill saved successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message.includes("unique")) {
      return NextResponse.json(
        { error: "Skill with this slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to save skill", detail: error.message },
      { status: 500 }
    );
  }
}

function isAdminRequest(request: NextRequest): boolean {
  const secret = process.env.REWARDS_ADMIN_SECRET;
  return !!secret && request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function DELETE(request: NextRequest) {
  try {
    const authedUser = await getRequestUser(request);
    const adminAuthorized = isAdminRequest(request);
    if (!authedUser && !adminAuthorized) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Skill id required" }, { status: 400 });
    }
    let targetId = id;
    if (!UUID_RE.test(id)) {
      const [found] = await db
        .select()
        .from(skills)
        .where(eq(skills.slug, id))
        .limit(1);
      if (!found) {
        return NextResponse.json(
          { error: "Skill not found" },
          { status: 404 }
        );
      }
      targetId = found.id;
    }
    const [skill] = await db.select().from(skills).where(eq(skills.id, targetId)).limit(1);
    if (!skill) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }
    if (!adminAuthorized && skill.userId !== authedUser?.id) {
      return NextResponse.json({ error: "Only the skill owner or an admin can delete it" }, { status: 403 });
    }

    await db.delete(skills).where(eq(skills.id, targetId));
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete skill", detail: error.message },
      { status: 500 }
    );
  }
}
