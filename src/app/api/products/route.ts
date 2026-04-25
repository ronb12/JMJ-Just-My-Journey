import { getSql } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const category = (searchParams.get("category") || "").trim();
  const sql = getSql();
  const like = `%${q}%`;
  let rows: unknown[];
  if (q && category) {
    rows = (await sql`
      SELECT * FROM products
      WHERE is_active = true AND category = ${category}
        AND (name ILIKE ${like} OR description ILIKE ${like})
      ORDER BY name LIMIT 200
    `) as unknown[];
  } else if (q) {
    rows = (await sql`
      SELECT * FROM products
      WHERE is_active = true
        AND (name ILIKE ${like} OR description ILIKE ${like})
      ORDER BY name LIMIT 200
    `) as unknown[];
  } else if (category) {
    rows = (await sql`
      SELECT * FROM products
      WHERE is_active = true AND category = ${category}
      ORDER BY name LIMIT 200
    `) as unknown[];
  } else {
    rows = (await sql`
      SELECT * FROM products
      WHERE is_active = true
      ORDER BY name LIMIT 200
    `) as unknown[];
  }
  return NextResponse.json({ products: rows });
}

const upsert = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  price: z.coerce.number().min(0),
  image_url: z.string().max(2000).optional().nullable(),
  stock_quantity: z.coerce.number().int().min(0),
  is_active: z.boolean().optional(),
});

export async function POST(req: Request) {
  const u = await requireAdmin();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const b = upsert.parse(await req.json().catch(() => ({})));
  const sql = getSql();
  if (b.id) {
    await sql`
      UPDATE products SET
        name = ${b.name},
        description = ${b.description ?? null},
        category = ${b.category ?? null},
        price = ${String(b.price)}::numeric,
        image_url = ${b.image_url ?? null},
        stock_quantity = ${b.stock_quantity},
        is_active = ${b.is_active ?? true},
        updated_at = now()
      WHERE id = ${b.id}::uuid
    `;
    return NextResponse.json({ id: b.id });
  }
  const n = (await sql`
    INSERT INTO products (name, description, category, price, image_url, stock_quantity, is_active)
    VALUES (
      ${b.name},
      ${b.description ?? null},
      ${b.category ?? null},
      ${String(b.price)}::numeric,
      ${b.image_url ?? null},
      ${b.stock_quantity},
      ${b.is_active ?? true}
    )
    RETURNING id
  `) as { id: string }[];
  return NextResponse.json({ id: n[0].id });
}

export async function DELETE(req: Request) {
  const u = await requireAdmin();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const id = z.string().uuid().parse(new URL(req.url).searchParams.get("id"));
  const sql = getSql();
  await sql`UPDATE products SET is_active = false, updated_at = now() WHERE id = ${id}::uuid`;
  return NextResponse.json({ ok: true });
}
