import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users, registrations } from "@/db/schema";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ed25519PublicKey, ed25519Signature, skillMdContent, name, payload } =
      body;

    if (!ed25519PublicKey && !skillMdContent) {
      return NextResponse.json(
        {
          error:
            "Either ed25519PublicKey+signature or skillMdContent is required",
        },
        { status: 400 }
      );
    }

    if (ed25519PublicKey && !ed25519Signature) {
      return NextResponse.json(
        { error: "ed25519Signature is required when ed25519PublicKey is provided" },
        { status: 400 }
      );
    }

    const agentToken = randomBytes(32).toString("hex");

    const [newUser] = await db
      .insert(users)
      .values({
        type: "agent",
        clawpumpApiKey: agentToken,
      })
      .returning();

    await db.insert(registrations).values({
      userId: newUser!.id,
      type: "agent",
      status: "active",
      ed25519PublicKey: ed25519PublicKey || null,
      ed25519Signature: ed25519Signature || null,
      skillMdContent: skillMdContent || null,
      payload: { name, ...payload },
    });

    return NextResponse.json(
      {
        agentId: newUser!.id,
        agentToken,
        message: "Agent registered successfully. Use agentToken for authentication.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Agent registration error:", error.message);
    return NextResponse.json(
      { error: "Agent registration failed", detail: error.message },
      { status: 500 }
    );
  }
}
