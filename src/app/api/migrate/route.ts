import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const secret = process.env.MIGRATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_verify_code text`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_verify_expiry timestamp`);
    return NextResponse.json({ ok: true, message: "Migration complete" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
