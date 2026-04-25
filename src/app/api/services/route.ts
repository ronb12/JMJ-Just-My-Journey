import { getSql } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const sql = getSql();
  const rows = (await sql`
    SELECT * FROM services WHERE is_active = true ORDER BY name
  `) as unknown[];
  return NextResponse.json({ services: rows });
}

const upsert = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  duration_minutes: z.coerce.number().int().min(0).optional().nullable(),
  price: z.coerce.number().min(0),
  image_url: z.union([z.string().url(), z.string().max(0)]).optional().nullable(),
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
      UPDATE services SET
        name = ${b.name},
        description = ${b.description ?? null},
        duration_minutes = ${b.duration_minutes ?? null},
        price = ${String(b.price)}::numeric,
        image_url = ${b.image_url || null},
        is_active = ${b.is_active ?? true},
        updated_at = now()
      WHERE id = ${b.id}::uuid
    `;
    return NextResponse.json({ ok: true, id: b.id });
  }
  const n = (await sql`
    INSERT INTO services (name, description, duration_minutes, price, image_url, is_active)
    VALUES (
      ${b.name},
      ${b.description ?? null},
      ${b.duration_minutes ?? null},
      ${String(b.price)}::numeric,
      ${b.image_url || null},
      ${b.is_active ?? true}
    )
    RETURNING id
  `) as { id: string }[];
  return NextResponse.json({ ok: true, id: n[0].id });
}

export async function DELETE(req: Request) {
  const u = await requireAdmin();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const id = z.string().uuid().parse(new URL(req.url).searchParams.get("id"));
  const sql = getSql();
  await sql`UPDATE services SET is_active = false, updated_at = now() WHERE id = ${id}::uuid`;
  return NextResponse.json({ ok: true });
}
