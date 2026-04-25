import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const sql = getSql();
  const rows = (await sql`
    SELECT * FROM notifications
    WHERE user_id = ${u.user!.id}::uuid
    ORDER BY created_at DESC
    LIMIT 100
  `) as unknown[];
  return NextResponse.json({ notifications: rows });
}
