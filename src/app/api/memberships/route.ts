import { getSql } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const sql = getSql();
  const rows = (await sql`SELECT * FROM memberships WHERE is_active = true ORDER BY name`) as unknown[];
  return NextResponse.json({ memberships: rows });
}

const upsert = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  monthly_price: z.coerce.number().min(0),
  benefits: z.string().optional().nullable(),
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
      UPDATE memberships SET
        name = ${b.name},
        description = ${b.description ?? null},
        monthly_price = ${String(b.monthly_price)}::numeric,
        benefits = ${b.benefits ?? null},
        is_active = ${b.is_active ?? true}
      WHERE id = ${b.id}::uuid
    `;
    return NextResponse.json({ id: b.id });
  }
  const n = (await sql`
    INSERT INTO memberships (name, description, monthly_price, benefits, is_active)
    VALUES (
      ${b.name},
      ${b.description ?? null},
      ${String(b.monthly_price)}::numeric,
      ${b.benefits ?? null},
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
  await sql`UPDATE memberships SET is_active = false WHERE id = ${id}::uuid`;
  return NextResponse.json({ ok: true });
}
