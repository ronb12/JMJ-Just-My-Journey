import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const body = z.object({ id: z.string().uuid() });

export async function POST(req: Request) {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const b = body.parse(await req.json().catch(() => ({})));
  const sql = getSql();
  await sql`
    UPDATE notifications SET is_read = true
    WHERE id = ${b.id}::uuid AND user_id = ${u.user!.id}::uuid
  `;
  return NextResponse.json({ ok: true });
}
