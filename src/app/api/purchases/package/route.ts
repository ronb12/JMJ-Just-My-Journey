import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request) {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const b = z.object({ packageId: z.string().uuid() }).parse(await req.json().catch(() => ({})));
  const sql = getSql();
  const p = (await sql`
    SELECT id, name, price FROM packages WHERE id = ${b.packageId}::uuid AND is_active = true
  `) as { id: string; name: string; price: string | null }[];
  if (!p[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const n = (await sql`
    INSERT INTO package_purchases (user_id, package_id, status, payment_status, total_amount)
    VALUES (
      ${u.user!.id}::uuid,
      ${b.packageId}::uuid,
      'pending',
      'pending',
      ${p[0].price}::numeric
    )
    RETURNING id, total_amount
  `) as { id: string; total_amount: string }[];
  return NextResponse.json(n[0]);
}
