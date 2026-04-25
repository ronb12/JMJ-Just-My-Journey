import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ conversationId: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const { conversationId } = await params;
  if (!z.string().uuid().safeParse(conversationId).success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const sql = getSql();
  const c = (await sql`SELECT id, customer_id FROM conversations WHERE id = ${conversationId}::uuid`) as {
    id: string;
    customer_id: string;
  }[];
  if (!c[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (u.user?.role !== "admin" && c[0].customer_id !== u.user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await sql`
    UPDATE messages SET is_read = true
    WHERE conversation_id = ${conversationId}::uuid
      AND receiver_id = ${u.user!.id}::uuid
  `;
  return NextResponse.json({ ok: true });
}
