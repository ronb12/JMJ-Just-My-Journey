import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getSql();
  const rows = (await sql`
    SELECT id, name, email, phone, role, created_at
    FROM users
    WHERE role = 'customer'
    ORDER BY created_at DESC
    LIMIT 500
  `) as unknown[];
  return NextResponse.json({ customers: rows });
}

const patchBody = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(1).optional().nullable(),
});

export async function PATCH(req: Request) {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const b = patchBody.parse(await req.json().catch(() => ({})));
  const sql = getSql();
  const ex = (await sql`SELECT id FROM users WHERE id = ${b.id}::uuid AND role = 'customer' LIMIT 1`) as { id: string }[];
  if (!ex[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await sql`
    UPDATE users SET
      name = COALESCE(${b.name ?? null}, name),
      email = COALESCE(${b.email ? b.email.toLowerCase() : null}, email),
      phone = COALESCE(${b.phone ?? null}, phone),
      updated_at = now()
    WHERE id = ${b.id}::uuid
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const u = await requireUser();
  if (u.error || u.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = z.string().uuid().parse(new URL(req.url).searchParams.get("id"));
  const sql = getSql();
  const ex = (await sql`SELECT id FROM users WHERE id = ${id}::uuid AND role = 'customer' LIMIT 1`) as { id: string }[];
  if (!ex[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const paidOrders = (await sql`
    SELECT count(*)::int AS c FROM orders WHERE user_id = ${id}::uuid AND payment_status = 'paid'
  `) as { c: number }[];
  const paidAppts = (await sql`
    SELECT count(*)::int AS c FROM appointments WHERE user_id = ${id}::uuid AND payment_status = 'paid'
  `) as { c: number }[];
  if ((paidOrders[0]?.c ?? 0) > 0 || (paidAppts[0]?.c ?? 0) > 0) {
    return NextResponse.json(
      { error: "Cannot delete customer with paid orders or paid appointments." },
      { status: 409 }
    );
  }

  await sql`DELETE FROM users WHERE id = ${id}::uuid`;
  return NextResponse.json({ ok: true });
}
