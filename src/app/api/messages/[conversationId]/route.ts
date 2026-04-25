import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ conversationId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const { conversationId } = await params;
  if (!z.string().uuid().safeParse(conversationId).success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const sql = getSql();
  const conv = (await sql`SELECT * FROM conversations WHERE id = ${conversationId}::uuid LIMIT 1`) as {
    id: string;
    customer_id: string;
  }[];
  if (!conv[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (u.user?.role !== "admin" && conv[0].customer_id !== u.user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const messages = (await sql`
    SELECT m.*, us.name AS sender_name
    FROM messages m
    JOIN users us ON us.id = m.sender_id
    WHERE m.conversation_id = ${conversationId}::uuid
    ORDER BY m.created_at ASC
  `) as unknown[];
  return NextResponse.json({ messages });
}
