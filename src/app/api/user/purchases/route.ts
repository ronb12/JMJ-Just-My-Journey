import { getSql } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const u = await requireUser();
  if (u.error) {
    return NextResponse.json({ error: u.error }, { status: 401 });
  }
  const sql = getSql();
  const packages = (await sql`
    SELECT pp.*, p.name, p.description
    FROM package_purchases pp
    JOIN packages p ON p.id = pp.package_id
    WHERE pp.user_id = ${u.user!.id}::uuid
    ORDER BY pp.created_at DESC
  `) as unknown[];
  const memberships = (await sql`
    SELECT mp.*, m.name, m.benefits
    FROM membership_purchases mp
    JOIN memberships m ON m.id = mp.membership_id
    WHERE mp.user_id = ${u.user!.id}::uuid
    ORDER BY mp.created_at DESC
  `) as unknown[];
  return NextResponse.json({ packagePurchases: packages, membershipPurchases: memberships });
}
