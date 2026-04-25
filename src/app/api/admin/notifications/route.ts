import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getSql();
  const rows = (await sql`
    SELECT id, user_id, title, message, type, is_read, link_url, created_at
    FROM notifications
    ORDER BY created_at DESC
    LIMIT 200
  `) as unknown[];
  return NextResponse.json({ notifications: rows });
}

export async function DELETE(req: Request) {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = z.string().uuid().parse(new URL(req.url).searchParams.get("id"));
  const sql = getSql();
  await sql`DELETE FROM notifications WHERE id = ${id}::uuid`;
  return NextResponse.json({ ok: true });
}

