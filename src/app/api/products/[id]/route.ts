import { getSql } from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }
  const sql = getSql();
  const rows = (await sql`SELECT * FROM products WHERE id = ${id}::uuid LIMIT 1`) as unknown[];
  if (!rows[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ product: rows[0] });
}
