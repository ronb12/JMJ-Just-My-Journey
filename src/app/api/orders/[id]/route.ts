import { getSql } from "@/lib/db";
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
  return NextResponse.json({ order: o[0], items });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  if (u.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const b = z.object({ fulfillment_status: fulfill }).parse(await req.json().catch(() => ({})));
  const sql = getSql();
  const o = (await sql`SELECT user_id FROM orders WHERE id = ${id}::uuid`) as { user_id: string }[];
  if (!o[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await sql`
    UPDATE orders SET fulfillment_status = ${b.fulfillment_status}, updated_at = now() WHERE id = ${id}::uuid
  `;
  const titles: Record<string, string> = {
    shipped: "Order shipped",
    delivered: "Order delivered",
    cancelled: "Order cancelled",
    processing: "Order is processing",
    unfulfilled: "Order updated",
  };
  await createNotification({
    userId: o[0].user_id,
    title: titles[b.fulfillment_status] || "Order update",
    message: `Your order #${id.slice(0, 8)} is now: ${b.fulfillment_status}.`,
    type: "order_fulfill",
    linkUrl: "/dashboard/orders",
  });
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
