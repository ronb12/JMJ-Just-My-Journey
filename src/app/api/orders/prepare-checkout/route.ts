import { getOrCreateCartId } from "@/lib/cart";
import { getSql } from "@/lib/db";
import { createNotification, getAdminUserIds } from "@/lib/notify";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";

/**
 * Create order with server-calculated line totals from product prices.
 * Client never sends money amounts.
 */
export async function POST() {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const sql = getSql();
  const cartId = await getOrCreateCartId(u.user!.id);
  const items = (await sql`
    SELECT
      ci.product_id,
      ci.quantity,
      p.name,
      p.price,
      p.stock_quantity,
      p.is_active
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.cart_id = ${cartId}::uuid
  `) as {
    product_id: string;
    quantity: number;
    name: string;
    price: string;
    stock_quantity: number;
    is_active: boolean;
  }[];
  if (!items.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  for (const it of items) {
    if (!it.is_active) {
      return NextResponse.json({ error: "A product in your cart is no longer available" }, { status: 400 });
    }
    if (it.quantity > it.stock_quantity) {
      return NextResponse.json({ error: "Stock changed — please update cart" }, { status: 400 });
    }
  }
  let total = 0;
  for (const it of items) {
    const line = Math.round(it.quantity * parseFloat(it.price) * 100) / 100;
    total += line;
  }
  const o = (await sql`
    INSERT INTO orders (user_id, total_amount, payment_status, fulfillment_status)
    VALUES (${u.user!.id}::uuid, ${String(total)}::numeric, 'pending', 'unfulfilled')
    RETURNING id
  `) as { id: string }[];
  const orderId = o[0].id;
  for (const it of items) {
    const up = parseFloat(it.price);
    const line = Math.round(it.quantity * up * 100) / 100;
    await sql`
      INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, line_total)
      VALUES (
        ${orderId}::uuid,
        ${it.product_id}::uuid,
        ${it.name},
        ${it.quantity},
        ${String(up)}::numeric,
        ${String(line)}::numeric
      )
    `;
  }
  await sql`DELETE FROM cart_items WHERE cart_id = ${cartId}::uuid`;
  await createNotification({
    userId: u.user!.id,
    title: "Order placed",
    message: "Complete payment to finish your order.",
    type: "order_placed",
    linkUrl: "/cart",
  });
  for (const adminId of await getAdminUserIds()) {
    await createNotification({
      userId: adminId,
      title: "New order created",
      message: `User ${u.user?.email} started checkout (pending payment)`,
      type: "order_pending",
      linkUrl: "/admin/orders",
    });
    break;
  }
  return NextResponse.json({ orderId, total: String(total) });
}
