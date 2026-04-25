import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const sql = getSql();
  await sql`DELETE FROM notifications WHERE id = ${id}::uuid AND user_id = ${u.user!.id}::uuid`;
  return NextResponse.json({ ok: true });
}
