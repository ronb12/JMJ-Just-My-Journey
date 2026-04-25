import { getSql } from "@/lib/db";
import { createNotification, getAdminUserIds } from "@/lib/notify";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  message: z.string().min(5),
});

export async function POST(req: Request) {
  const data = schema.parse(await req.json().catch(() => ({})));
  const sql = getSql();
  await sql`
    INSERT INTO contact_messages (name, email, phone, message)
    VALUES (
      ${data.name},
      ${data.email},
      ${data.phone ?? null},
      ${data.message}
    )
  `;
  for (const id of await getAdminUserIds()) {
    await createNotification({
      userId: id,
      title: "New contact form",
      message: `From ${data.name}: ${data.message.slice(0, 200)}...`,
      type: "contact_form",
      linkUrl: "/admin/messages",
    });
  }
  return NextResponse.json({ ok: true });
}
