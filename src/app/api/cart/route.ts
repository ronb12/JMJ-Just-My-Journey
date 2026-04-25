import { getOrCreateCartId } from "@/lib/cart";
import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const add = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).default(1),
});

export async function GET() {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const sql = getSql();
  const cartId = await getOrCreateCartId(u.user!.id);
  const items = (await sql`
    SELECT
      ci.id,
      ci.product_id,
      ci.quantity,
      p.name,
      p.price,
      p.image_url,
      p.stock_quantity,
      p.is_active
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    WHERE ci.cart_id = ${cartId}::uuid
    ORDER BY ci.created_at
  `) as Record<string, unknown>[];
  return NextResponse.json({ items, cartId });
}

export async function POST(req: Request) {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const b = add.parse(await req.json().catch(() => ({})));
  const sql = getSql();
  const prod = (await sql`
    SELECT id, stock_quantity, is_active, price, name
    FROM products
    WHERE id = ${b.productId}::uuid
    LIMIT 1
  `) as { id: string; stock_quantity: number; is_active: boolean; price: string; name: string }[];
  if (!prod[0]?.is_active) {
    return NextResponse.json({ error: "Product unavailable" }, { status: 400 });
  }
  if (prod[0].stock_quantity < b.quantity) {
    return NextResponse.json({ error: "Not enough stock" }, { status: 400 });
  }
  const cartId = await getOrCreateCartId(u.user!.id);
  const ex = (await sql`
    SELECT id, quantity FROM cart_items
    WHERE cart_id = ${cartId}::uuid AND product_id = ${b.productId}::uuid
  `) as { id: string; quantity: number }[];
  if (ex[0]) {
    const nq = ex[0].quantity + b.quantity;
    if (nq > prod[0].stock_quantity) {
      return NextResponse.json({ error: "Not enough stock" }, { status: 400 });
    }
    await sql`UPDATE cart_items SET quantity = ${nq} WHERE id = ${ex[0].id}::uuid`;
  } else {
    await sql`
      INSERT INTO cart_items (cart_id, product_id, quantity)
      VALUES (${cartId}::uuid, ${b.productId}::uuid, ${b.quantity})
    `;
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const b = z
    .object({ itemId: z.string().uuid(), quantity: z.coerce.number().int().min(1) })
    .parse(await req.json().catch(() => ({})));
  const sql = getSql();
  const row = (await sql`
    SELECT ci.id, ci.cart_id, ci.product_id, ci.quantity, c.user_id, p.stock_quantity
    FROM cart_items ci
    JOIN carts c ON c.id = ci.cart_id
    JOIN products p ON p.id = ci.product_id
    WHERE ci.id = ${b.itemId}::uuid
  `) as { user_id: string; stock_quantity: number }[];
  if (!row[0] || row[0].user_id !== u.user!.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (b.quantity > row[0].stock_quantity) {
    return NextResponse.json({ error: "Not enough stock" }, { status: 400 });
  }
  await sql`UPDATE cart_items SET quantity = ${b.quantity} WHERE id = ${b.itemId}::uuid`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const itemId = z.string().uuid().parse(searchParams.get("itemId") || undefined);
  const sql = getSql();
  const row = (await sql`
    SELECT ci.id FROM cart_items ci
    JOIN carts c ON c.id = ci.cart_id
    WHERE ci.id = ${itemId}::uuid AND c.user_id = ${u.user!.id}::uuid
  `) as { id: string }[];
  if (!row[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await sql`DELETE FROM cart_items WHERE id = ${itemId}::uuid`;
  return NextResponse.json({ ok: true });
}
