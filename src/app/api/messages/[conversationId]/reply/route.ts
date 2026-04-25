import { getSql } from "@/lib/db";
import { createNotification } from "@/lib/notify";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ conversationId: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const { conversationId } = await params;
  if (!z.string().uuid().safeParse(conversationId).success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const b = z.object({ body: z.string().min(1).max(8000) }).parse(await req.json().catch(() => ({})));
  const sql = getSql();
  const c = (await sql`SELECT * FROM conversations WHERE id = ${conversationId}::uuid`) as {
    id: string;
    customer_id: string;
    admin_id: string | null;
  }[];
  if (!c[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isAdmin = u.user?.role === "admin";
  const isCustomer = c[0].customer_id === u.user!.id;
  if (!isAdmin && !isCustomer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const receiverId = isAdmin ? c[0].customer_id : c[0].admin_id;
  if (!receiverId) {
    return NextResponse.json({ error: "Invalid conversation" }, { status: 400 });
  }
  await sql`
    INSERT INTO messages (conversation_id, sender_id, receiver_id, body)
    VALUES (
      ${conversationId}::uuid,
      ${u.user!.id}::uuid,
      ${receiverId}::uuid,
      ${b.body}
    )
  `;
  await sql`UPDATE conversations SET updated_at = now() WHERE id = ${conversationId}::uuid`;
  const receiver = (await sql`SELECT role FROM users WHERE id = ${receiverId}::uuid LIMIT 1`) as {
    role: string;
  }[];
  const link =
    receiver[0]?.role === "admin" ? "/admin/messages" : "/dashboard/messages";
  await createNotification({
    userId: receiverId,
    title: "New reply",
    message: "You have a new message in your conversation.",
    type: "message",
    linkUrl: link,
  });
  return NextResponse.json({ ok: true });
}
