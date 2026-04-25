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
    SELECT id, email, source, created_at
    FROM newsletter_subscribers
    ORDER BY created_at DESC
    LIMIT 2000
  `) as { id: string; email: string; source: string | null; created_at: string }[];
  return NextResponse.json({ subscribers: rows });
}

export async function DELETE(req: Request) {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = z.string().uuid().parse(new URL(req.url).searchParams.get("id"));
  const sql = getSql();
  await sql`DELETE FROM newsletter_subscribers WHERE id = ${id}::uuid`;
  return NextResponse.json({ ok: true });
}
