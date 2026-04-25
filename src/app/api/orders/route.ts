import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const sql = getSql();
  if (u.user?.role === "admin") {
    const rows = (await sql`
      SELECT o.*, u.name AS user_name, u.email
      FROM orders o
      JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC
      LIMIT 200
    `) as unknown[];
    return NextResponse.json({ orders: rows });
  }
  const rows = (await sql`
    SELECT * FROM orders
    WHERE user_id = ${u.user!.id}::uuid
    ORDER BY created_at DESC
  `) as unknown[];
  return NextResponse.json({ orders: rows });
}
