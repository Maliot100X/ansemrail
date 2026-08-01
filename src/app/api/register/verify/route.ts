import { NextRequest, NextResponse } from "next/server";
import nacl from "tweetnacl";
import bs58 from "bs58";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicKey, signature, message } = body;

    if (!publicKey || !signature || !message) {
      return NextResponse.json(
        { error: "publicKey, signature, and message are required" },
        { status: 400 }
      );
    }

    const pubKeyBytes = bs58.decode(publicKey);
    const sigBytes = bs58.decode(signature);
    const msgBytes = new TextEncoder().encode(message);

    const isValid = nacl.sign.detached.verify(msgBytes, sigBytes, pubKeyBytes);

    return NextResponse.json({
      valid: isValid,
      publicKey,
      message,
    });
  } catch (error: any) {
    console.error("Signature verification error:", error.message);
    return NextResponse.json(
      { error: "Verification failed", detail: error.message },
      { status: 500 }
    );
  }
}
