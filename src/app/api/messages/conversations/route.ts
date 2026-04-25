import { getSql } from "@/lib/db";
import { createNotification } from "@/lib/notify";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const sql = getSql();
  if (u.user?.role === "admin") {
    const rows = (await sql`
      SELECT c.*, u.name AS customer_name, u.email AS customer_email,
        (SELECT count(*)::int FROM messages m WHERE m.conversation_id = c.id AND m.is_read = false AND m.receiver_id = ${u.user!.id}::uuid) AS unread
      FROM conversations c
      JOIN users u ON u.id = c.customer_id
      ORDER BY c.updated_at DESC
      LIMIT 200
    `) as unknown[];
    return NextResponse.json({ conversations: rows });
  }
  const rows = (await sql`
    SELECT c.*, u.name AS admin_name, u.email AS admin_email
    FROM conversations c
    LEFT JOIN users u ON u.id = c.admin_id
    WHERE c.customer_id = ${u.user!.id}::uuid
    ORDER BY c.updated_at DESC
  `) as unknown[];
  return NextResponse.json({ conversations: rows });
}

const postSchema = z.object({
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(8000),
  orderId: z.string().uuid().optional().nullable(),
  appointmentId: z.string().uuid().optional().nullable(),
  customerId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const b = postSchema.parse(await req.json().catch(() => ({})));
  const sql = getSql();
  if (u.user?.role === "admin") {
    if (!b.customerId) {
      return NextResponse.json({ error: "customerId required for admin" }, { status: 400 });
    }
    const c = (await sql`
      INSERT INTO conversations (customer_id, admin_id, subject, status, order_id, appointment_id)
      VALUES (
        ${b.customerId}::uuid,
        ${u.user!.id}::uuid,
        ${b.subject},
        'open',
        ${b.orderId ? b.orderId : null}::uuid,
        ${b.appointmentId ? b.appointmentId : null}::uuid
      )
      RETURNING id
    `) as { id: string }[];
    await sql`
      INSERT INTO messages (conversation_id, sender_id, receiver_id, body)
      VALUES (
        ${c[0].id}::uuid,
        ${u.user!.id}::uuid,
        ${b.customerId}::uuid,
        ${b.body}
      )
    `;
    await sql`UPDATE conversations SET updated_at = now() WHERE id = ${c[0].id}::uuid`;
    await createMsgNotification(
      b.customerId,
      "/dashboard/messages"
    );
    return NextResponse.json({ id: c[0].id });
  }
  const admin = (await sql`SELECT id FROM users WHERE role = 'admin' LIMIT 1`) as { id: string }[];
  if (!admin[0]) {
    return NextResponse.json({ error: "No admin user yet" }, { status: 500 });
  }
  const c = (await sql`
    INSERT INTO conversations (customer_id, admin_id, subject, status, order_id, appointment_id)
    VALUES (
      ${u.user!.id}::uuid,
      ${admin[0].id}::uuid,
      ${b.subject},
      'open',
      ${b.orderId ? b.orderId : null}::uuid,
      ${b.appointmentId ? b.appointmentId : null}::uuid
    )
    RETURNING id
  `) as { id: string }[];
  await sql`
    INSERT INTO messages (conversation_id, sender_id, receiver_id, body)
    VALUES (
      ${c[0].id}::uuid,
      ${u.user!.id}::uuid,
      ${admin[0].id}::uuid,
      ${b.body}
    )
  `;
  await sql`UPDATE conversations SET updated_at = now() WHERE id = ${c[0].id}::uuid`;
  await createMsgNotification(admin[0].id, "/admin/messages");
  return NextResponse.json({ id: c[0].id });
}

async function createMsgNotification(userId: string, linkUrl: string) {
  await createNotification({
    userId,
    title: "New message",
    message: "You have a new support message in your inbox.",
    type: "message",
    linkUrl,
  });
}
