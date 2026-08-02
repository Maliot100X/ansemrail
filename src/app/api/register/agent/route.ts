import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { users, registrations } from "@/db/schema";
import { randomBytes } from "crypto";
import nacl from "tweetnacl";
import bs58 from "bs58";

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

    let verified = false;

    if (ed25519PublicKey && ed25519Signature) {
      const message =
        (payload?.message as string) ||
        (typeof payload === "string" ? payload : "") ||
        "";
      if (!message) {
        return NextResponse.json(
          { error: "payload.message is required for Ed25519 signature verification" },
          { status: 400 }
        );
      }
      try {
        const pubKeyBytes = bs58.decode(ed25519PublicKey);
        const sigBytes = bs58.decode(ed25519Signature);
        const msgBytes = new TextEncoder().encode(message);
        verified = nacl.sign.detached.verify(msgBytes, sigBytes, pubKeyBytes);
      } catch (decodeErr: any) {
        return NextResponse.json(
          { error: "Invalid base58 encoding for publicKey or signature", detail: decodeErr.message },
          { status: 400 }
        );
      }
      if (!verified) {
        return NextResponse.json(
          { error: "Ed25519 signature verification failed — signature does not match public key and message" },
          { status: 401 }
        );
      }
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
      payload: { name, ...payload, verified },
    });

    return NextResponse.json(
      {
        agentId: newUser!.id,
        agentToken,
        verified,
        message: verified
          ? "Agent registered successfully — Ed25519 signature verified."
          : "Agent registered successfully via SKILL.md upload.",
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
