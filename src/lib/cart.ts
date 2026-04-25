import { getSql } from "./db";

export async function getOrCreateCartId(userId: string): Promise<string> {
  const sql = getSql();
  const existing = (await sql`SELECT id FROM carts WHERE user_id = ${userId}::uuid LIMIT 1`) as { id: string }[];
  if (existing[0]) {
    return existing[0].id;
  }
  const n = (await sql`
    INSERT INTO carts (user_id) VALUES (${userId}::uuid) RETURNING id
  `) as { id: string }[];
  return n[0].id;
}
