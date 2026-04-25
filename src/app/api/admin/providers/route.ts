import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const u = z.object({
  name: z.string().min(1),
  bio: z.string().optional().nullable(),
  specialty: z.string().optional().nullable(),
  image_url: z.string().max(2000).optional().nullable(),
  is_active: z.boolean().optional(),
});

const upsert = u.extend({ id: z.string().uuid().optional() });

export async function GET() {
  const admin = await requireUser();
  if (admin.error || admin.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getSql();
  const rows = (await sql`SELECT * FROM providers ORDER BY name`) as unknown[];
  return NextResponse.json({ providers: rows });
}

export async function POST(req: Request) {
  const a = await requireUser();
  if (a.error || a.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const b = upsert.parse(await req.json().catch(() => ({})));
  const sql = getSql();
  if (b.id) {
    await sql`
      UPDATE providers SET
        name = ${b.name},
        bio = ${b.bio ?? null},
        specialty = ${b.specialty ?? null},
        image_url = ${b.image_url ?? null},
        is_active = ${b.is_active ?? true}
      WHERE id = ${b.id}::uuid
    `;
    return NextResponse.json({ id: b.id });
  }
  const n = (await sql`
    INSERT INTO providers (name, bio, specialty, image_url, is_active)
    VALUES (
      ${b.name},
      ${b.bio ?? null},
      ${b.specialty ?? null},
      ${b.image_url ?? null},
      ${b.is_active ?? true}
    )
    RETURNING id
  `) as { id: string }[];
  return NextResponse.json({ id: n[0].id });
}

export async function DELETE(req: Request) {
  const a = await requireUser();
  if (a.error || a.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = z.string().uuid().parse(new URL(req.url).searchParams.get("id"));
  const sql = getSql();
  const del = (await sql`DELETE FROM providers WHERE id = ${id}::uuid RETURNING id`) as { id: string }[];
  if (!del[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
