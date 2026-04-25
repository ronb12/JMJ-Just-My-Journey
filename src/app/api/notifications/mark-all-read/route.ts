import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST() {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const sql = getSql();
  await sql`UPDATE notifications SET is_read = true WHERE user_id = ${u.user!.id}::uuid`;
  return NextResponse.json({ ok: true });
}
