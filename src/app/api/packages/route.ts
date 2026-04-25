import { getSql } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const sql = getSql();
  const rows = (await sql`SELECT * FROM packages WHERE is_active = true ORDER BY name`) as unknown[];
  return NextResponse.json({ packages: rows });
}

const upsert = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.coerce.number().min(0),
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
      UPDATE packages SET
        name = ${b.name},
        description = ${b.description ?? null},
        price = ${String(b.price)}::numeric,
        is_active = ${b.is_active ?? true}
      WHERE id = ${b.id}::uuid
    `;
    return NextResponse.json({ id: b.id });
  }
  const n = (await sql`
    INSERT INTO packages (name, description, price, is_active)
    VALUES (${b.name}, ${b.description ?? null}, ${String(b.price)}::numeric, ${b.is_active ?? true})
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
  try {
    const del = (await sql`DELETE FROM packages WHERE id = ${id}::uuid RETURNING id`) as { id: string }[];
    if (!del[0]) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "23503") {
      return NextResponse.json(
        { error: "Cannot delete package because it is referenced by other records." },
        { status: 409 }
      );
    }
    throw e;
  }
}
