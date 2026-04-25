import { getSql } from "@/lib/db";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  address: z.string().max(4000).optional(),
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
  const address = data.address?.trim() ? data.address.trim() : null;
  const rows = (await sql`
    INSERT INTO users (name, email, password_hash, role, phone, address)
    VALUES (
      ${data.name},
      ${email},
      ${password_hash},
      'customer',
      ${data.phone ?? null},
      ${address}
    )
    RETURNING id, name, email, role, created_at
  `) as { id: string; name: string; email: string; role: string; created_at: string }[];
  return NextResponse.json({ user: rows[0] });
}
