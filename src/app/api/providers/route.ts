import { getSql } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const sql = getSql();
  const rows = (await sql`
    SELECT * FROM providers WHERE is_active = true ORDER BY name
  `) as unknown[];
  return NextResponse.json({ providers: rows });
}
