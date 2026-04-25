import { neon, NeonQueryFunction } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
let _sql: NeonQueryFunction<false, false> | null = null;

export function getSql(): NeonQueryFunction<false, false> {
  if (!url) {
    throw new Error("Missing DATABASE_URL");
  }
  if (!_sql) {
    _sql = neon(url);
  }
  return _sql;
}

export function hasDatabase(): boolean {
  return Boolean(url);
}
