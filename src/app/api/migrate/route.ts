import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_verify_code text`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_verify_expiry timestamp`);
    return NextResponse.json({ ok: true, message: "Migration complete" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
