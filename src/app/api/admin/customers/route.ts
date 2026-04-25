import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getSql();
  const rows = (await sql`
    SELECT id, name, email, phone, role, created_at
    FROM users
    WHERE role = 'customer'
    ORDER BY created_at DESC
    LIMIT 500
  `) as unknown[];
  return NextResponse.json({ customers: rows });
}
