import { logAnalyticsEvent } from "@/lib/analytics";
import { getSql } from "@/lib/db";
import { createNotification, getAdminUserIds } from "@/lib/notify";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isMissingTable(e: unknown) {
  return (e as { code?: string })?.code === "42P01";
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sql = getSql();
  let rows: {
    cart_id: string;
    user_id: string;
    email: string;
    items_count: number;
    cart_value: string;
  }[] = [];

  try {
    rows = (await sql`
      SELECT
        c.id AS cart_id,
        c.user_id,
        u.email,
        COUNT(ci.id)::int AS items_count,
        COALESCE(SUM(ci.quantity * p.price::numeric), 0)::text AS cart_value
      FROM carts c
      JOIN users u ON u.id = c.user_id
      JOIN cart_items ci ON ci.cart_id = c.id
      JOIN products p ON p.id = ci.product_id
      WHERE c.updated_at < (now() - interval '24 hours')
      AND NOT EXISTS (
        SELECT 1
        FROM cart_reminder_logs crl
        WHERE crl.cart_id = c.id
          AND crl.sent_at > (now() - interval '72 hours')
      )
      GROUP BY c.id, c.user_id, u.email
    `) as typeof rows;
  } catch (e) {
    if (isMissingTable(e)) {
      return NextResponse.json({ ok: true, skipped: true, reason: "migrations not applied" });
    }
    throw e;
  }

  let sent = 0;
  for (const r of rows) {
    try {
      await sql`
        INSERT INTO cart_reminder_logs (cart_id, user_id, items_count, cart_value)
        VALUES (
          ${r.cart_id}::uuid,
          ${r.user_id}::uuid,
          ${r.items_count},
          ${r.cart_value}::numeric
        )
      `;
      await createNotification({
        userId: r.user_id,
        title: "You left items in your bag",
        message: `You still have ${r.items_count} item(s) saved — complete checkout when you’re ready.`,
        type: "cart_abandoned",
        linkUrl: "/cart",
      });
      await logAnalyticsEvent({
        name: "abandoned_cart_reminder_sent",
        userId: r.user_id,
        properties: {
          cartId: r.cart_id,
          itemsCount: r.items_count,
          cartValue: r.cart_value,
        },
      });
      sent += 1;
    } catch (e) {
      if (isMissingTable(e)) break;
      throw e;
    }
  }

  try {
    await logAnalyticsEvent({
      name: "abandoned_cart_cron_run",
      userId: null,
      properties: { candidates: rows.length, remindersSent: sent },
    });
  } catch {
    /* ignore */
  }

  if (sent > 0) {
    for (const adminId of await getAdminUserIds()) {
      await createNotification({
        userId: adminId,
        title: "Abandoned cart reminders",
        message: `Sent ${sent} customer reminder(s) for saved carts.`,
        type: "admin_cart_abandonment",
        linkUrl: "/admin/analytics",
      });
      break;
    }
  }

  return NextResponse.json({ ok: true, candidates: rows.length, remindersSent: sent });
}
