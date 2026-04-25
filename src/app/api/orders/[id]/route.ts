import { getSql } from "@/lib/db";
import { insertOrderTrackingEvent, listOrderTrackingEvents } from "@/lib/order-tracking";
import { createNotification } from "@/lib/notify";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const fulfill = z.enum([
  "unfulfilled",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);

function isMissingTable(e: unknown) {
  return (e as { code?: string })?.code === "42P01" || (e as { code?: string })?.code === "undefined_table";
}

function isMissingColumn(e: unknown) {
  return (e as { code?: string })?.code === "42703";
}

export async function GET(_req: Request, { params }: Ctx) {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const sql = getSql();
  const o = (await sql`SELECT * FROM orders WHERE id = ${id}::uuid LIMIT 1`) as {
    user_id: string;
  }[];
  if (!o[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (u.user?.role !== "admin" && o[0].user_id !== u.user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const items = (await sql`SELECT * FROM order_items WHERE order_id = ${id}::uuid`) as unknown[];
  let events: unknown[] = [];
  try {
    events = await listOrderTrackingEvents(sql, id);
  } catch (e) {
    if (isMissingTable(e) || isMissingColumn(e)) {
      events = [];
    } else {
      throw e;
    }
  }
  return NextResponse.json({ order: o[0], items, events });
}

const patchSchema = z
  .object({
    fulfillment_status: fulfill.optional(),
    tracking_carrier: z.string().max(200).optional().nullable(),
    tracking_number: z.string().max(200).optional().nullable(),
    tracking_url: z.string().max(2000).optional().nullable(),
    customer_message: z.string().max(2000).optional().nullable(),
  })
  .strict();

export async function PATCH(req: Request, { params }: Ctx) {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  if (u.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const b = patchSchema.parse(await req.json().catch(() => ({})));
  if (Object.keys(b).length === 0) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }

  const sql = getSql();
  const row = (await sql`SELECT * FROM orders WHERE id = ${id}::uuid LIMIT 1`) as Record<string, unknown>[];
  if (!row[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const before = row[0] as {
    user_id: string;
    fulfillment_status: string;
    tracking_carrier: string | null;
    tracking_number: string | null;
    tracking_url: string | null;
  };

  const nextFulfill = b.fulfillment_status ?? before.fulfillment_status;
  const nextCarrier = b.tracking_carrier !== undefined ? b.tracking_carrier : before.tracking_carrier;
  const nextNum = b.tracking_number !== undefined ? b.tracking_number : before.tracking_number;
  const nextUrl = b.tracking_url !== undefined ? b.tracking_url : before.tracking_url;

  try {
    await sql`
      UPDATE orders
      SET
        fulfillment_status = ${nextFulfill},
        tracking_carrier = ${nextCarrier},
        tracking_number = ${nextNum},
        tracking_url = ${nextUrl},
        updated_at = now()
      WHERE id = ${id}::uuid
    `;
  } catch (e: unknown) {
    if (isMissingColumn(e)) {
      await sql`UPDATE orders SET fulfillment_status = ${nextFulfill}, updated_at = now() WHERE id = ${id}::uuid`;
    } else {
      throw e;
    }
  }

  const customerLink = `/dashboard/orders?o=${id}`;

  async function safeEvent(p: Parameters<typeof insertOrderTrackingEvent>[1]) {
    try {
      await insertOrderTrackingEvent(sql, p);
    } catch (e) {
      if (isMissingTable(e)) return;
      throw e;
    }
  }

  if (b.fulfillment_status !== undefined && b.fulfillment_status !== before.fulfillment_status) {
    await safeEvent({
      orderId: id,
      fulfillmentStatus: b.fulfillment_status,
      source: "fulfillment",
      message: `Order status: ${b.fulfillment_status.replace(/_/g, " ")}`,
    });
    const titles: Record<string, string> = {
      shipped: "Your order shipped",
      delivered: "Order delivered",
      cancelled: "Order update",
      processing: "Order is processing",
      unfulfilled: "Order update",
    };
    await createNotification({
      userId: before.user_id,
      title: titles[b.fulfillment_status] || "Order update",
      message: `Order #${id.slice(0, 8)} is now: ${b.fulfillment_status}.`,
      type: "order_fulfill",
      linkUrl: customerLink,
    });
  }

  const trackChanged =
    b.tracking_carrier !== undefined || b.tracking_number !== undefined || b.tracking_url !== undefined;
  if (trackChanged) {
    const parts: string[] = [];
    if (nextCarrier) parts.push(`Carrier: ${nextCarrier}`);
    if (nextNum) parts.push(`Tracking: ${nextNum}`);
    if (nextUrl) parts.push("A tracking link is available.");
    if (parts.length) {
      await safeEvent({
        orderId: id,
        fulfillmentStatus: nextFulfill,
        source: "tracking",
        message: parts.join(" · "),
      });
      await createNotification({
        userId: before.user_id,
        title: "Tracking update",
        message: `Order #${id.slice(0, 8)}: ${parts.join(" ")}`.slice(0, 500),
        type: "order_tracking",
        linkUrl: customerLink,
      });
    }
  }

  if (b.customer_message?.trim()) {
    await safeEvent({
      orderId: id,
      fulfillmentStatus: nextFulfill,
      source: "admin_note",
      message: b.customer_message.trim(),
    });
    await createNotification({
      userId: before.user_id,
      title: "Message about your order",
      message: b.customer_message.trim().slice(0, 500),
      type: "order_message",
      linkUrl: customerLink,
    });
  }

  return NextResponse.json({ ok: true });
}

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
  const o = (await sql`
    SELECT id, user_id, payment_status, fulfillment_status
    FROM orders
    WHERE id = ${id}::uuid
    LIMIT 1
  `) as { id: string; user_id: string; payment_status: string; fulfillment_status: string }[];
  if (!o[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (u.user?.role !== "admin" && o[0].user_id !== u.user!.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (o[0].payment_status !== "pending") {
    return NextResponse.json({ error: "Cannot delete an order after payment." }, { status: 409 });
  }
  if (o[0].fulfillment_status !== "unfulfilled") {
    return NextResponse.json({ error: "Only unfulfilled pending orders can be deleted." }, { status: 409 });
  }
  await sql`DELETE FROM orders WHERE id = ${id}::uuid`;
  return NextResponse.json({ ok: true });
}
