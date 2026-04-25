import { getSql } from "@/lib/db";
import { createNotification, getAdminUserIds } from "@/lib/notify";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
  source: z.enum(["footer", "contact", "account", "other"]).optional(),
});

function normalizeEmail(raw: string) {
  return raw.trim().toLowerCase();
}

export async function POST(req: Request) {
  const data = bodySchema.parse(await req.json().catch(() => ({})));
  const email = normalizeEmail(data.email);
  if (!email) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const source = data.source ?? "other";
  const sql = getSql();
  const inserted = (await sql`
    INSERT INTO newsletter_subscribers (email, source)
    VALUES (
      ${email},
      ${source}
    )
    ON CONFLICT (email) DO NOTHING
    RETURNING id, email, created_at
  `) as { id: string; email: string; created_at: string }[];

  if (inserted[0]) {
    for (const id of await getAdminUserIds()) {
      await createNotification({
        userId: id,
        title: "New newsletter subscriber",
        message: `${email} signed up for updates (${source}).`,
        type: "newsletter",
        linkUrl: "/admin/newsletter",
      });
    }
  }

  return NextResponse.json({ ok: true });
}
