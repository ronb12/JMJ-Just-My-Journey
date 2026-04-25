import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request) {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const b = z
    .object({ membershipId: z.string().uuid() })
    .parse(await req.json().catch(() => ({})));
  const sql = getSql();
  const p = (await sql`
    SELECT id, name, monthly_price
    FROM memberships
    WHERE id = ${b.membershipId}::uuid AND is_active = true
  `) as { id: string; name: string; monthly_price: string | null }[];
  if (!p[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const n = (await sql`
    INSERT INTO membership_purchases (user_id, membership_id, status, payment_status, total_amount)
    VALUES (
      ${u.user!.id}::uuid,
      ${b.membershipId}::uuid,
      'pending',
      'pending',
      ${p[0].monthly_price}::numeric
    )
    RETURNING id, total_amount
  `) as { id: string; total_amount: string }[];
  return NextResponse.json(n[0]);
}
