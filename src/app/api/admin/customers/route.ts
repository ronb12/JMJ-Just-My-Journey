import { getSql } from "@/lib/db";
import { emptyToNull } from "@/lib/user-address";
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
    SELECT
      id, name, email, phone,
      address_line1, address_line2, city, state, postal_code, country,
      role, created_at
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
  address_line1: z.string().max(200).optional().nullable(),
  address_line2: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  postal_code: z.string().max(30).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
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

  const cur = (await sql`
    SELECT
      name, email, phone,
      address_line1, address_line2, city, state, postal_code, country
    FROM users
    WHERE id = ${b.id}::uuid
    LIMIT 1
  `) as {
    name: string | null;
    email: string;
    phone: string | null;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
  }[];
  if (!cur[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const c = cur[0];

  const name = b.name === undefined ? c.name : b.name;
  const email =
    b.email === undefined || b.email === null
      ? c.email
      : b.email
        ? b.email.toLowerCase()
        : c.email;
  const phone = b.phone === undefined ? c.phone : b.phone;

  const pick = (next: string | null | undefined, was: string | null) => {
    if (next === undefined) return was;
    return next === null ? null : emptyToNull(next) ?? null;
  };

  const address_line1 = pick(b.address_line1, c.address_line1);
  const address_line2 = pick(b.address_line2, c.address_line2);
  const city = pick(b.city, c.city);
  const state = pick(b.state, c.state);
  const postal_code = pick(b.postal_code, c.postal_code);
  const country = pick(b.country, c.country);

  await sql`
    UPDATE users SET
      name = ${name},
      email = ${email},
      phone = ${phone},
      address_line1 = ${address_line1},
      address_line2 = ${address_line2},
      city = ${city},
      state = ${state},
      postal_code = ${postal_code},
      country = ${country},
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
