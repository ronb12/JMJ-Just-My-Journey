import { getSql } from "@/lib/db";
import { emptyToNull } from "@/lib/user-address";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  address_line1: z.string().max(200).optional(),
  address_line2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postal_code: z.string().max(30).optional(),
  country: z.string().max(100).optional(),
});

export async function POST(req: Request) {
  const data = schema.parse(await req.json().catch(() => ({})));
  const sql = getSql();
  const email = data.email.toLowerCase();
  const existing = (await sql`SELECT id FROM users WHERE lower(email) = ${email} LIMIT 1`) as { id: string }[];
  if (existing.length) {
    return NextResponse.json({ error: "Email already registered" }, { status: 400 });
  }
  const password_hash = await hash(data.password, 10);
  const address_line1 = emptyToNull(data.address_line1);
  const address_line2 = emptyToNull(data.address_line2);
  const city = emptyToNull(data.city);
  const state = emptyToNull(data.state);
  const postal_code = emptyToNull(data.postal_code);
  const country = emptyToNull(data.country);
  const rows = (await sql`
    INSERT INTO users (
      name, email, password_hash, role, phone,
      address_line1, address_line2, city, state, postal_code, country
    )
    VALUES (
      ${data.name},
      ${email},
      ${password_hash},
      'customer',
      ${data.phone ?? null},
      ${address_line1},
      ${address_line2},
      ${city},
      ${state},
      ${postal_code},
      ${country}
    )
    RETURNING id, name, email, role, created_at
  `) as { id: string; name: string; email: string; role: string; created_at: string }[];
  return NextResponse.json({ user: rows[0] });
}
